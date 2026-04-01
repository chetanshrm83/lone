import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';

// ─────────────────────────────────────────────────────────────────────────────
// EMI PRIORITY ENGINE — deterministic, rule-based
// priorityScore = (interestRate * 0.5) + (overdueDays * 0.3) + (penaltyRisk * 0.2)
// penaltyRisk is normalized: (penaltyRate / maxPenaltyRate) * 100
// ─────────────────────────────────────────────────────────────────────────────
function computePriorityScore(interestRate: number, overdueDays: number, penaltyRate: number): number {
  const normalizedPenalty = Math.min(penaltyRate * 10, 100); // scale to 0-100
  return (interestRate * 0.5) + (overdueDays * 0.3) + (normalizedPenalty * 0.2);
}

function getPriorityExplanation(loan: any): string {
  const parts: string[] = [];
  if (loan.interestRate >= 24) parts.push(`Very high interest rate of ${loan.interestRate}% annually`);
  else if (loan.interestRate >= 14) parts.push(`High interest rate of ${loan.interestRate}%`);
  else parts.push(`Moderate interest rate of ${loan.interestRate}%`);

  if (loan.overdueDays > 0) parts.push(`${loan.overdueDays} days overdue — every extra day adds penalty risk`);
  if (loan.penaltyRate > 0) parts.push(`Penalty rate of ${loan.penaltyRate}% applies to overdue amounts`);

  return parts.join('. ') + '.';
}

@Injectable()
export class LoansService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateLoanDto) {
    const score = computePriorityScore(dto.interestRate, dto.overdueDays || 0, dto.penaltyRate || 0);
    const status = (dto.overdueDays || 0) > 0 ? 'OVERDUE' : 'ACTIVE';
    return this.prisma.loan.create({
      data: { ...dto, userId, dueDate: new Date(dto.dueDate), priorityScore: score, status: status as any },
    });
  }

  async findAll(userId: string) {
    const loans = await this.prisma.loan.findMany({
      where: { userId },
      orderBy: { priorityScore: 'desc' },
      include: { emiHistory: { orderBy: { paidOn: 'desc' }, take: 5 } },
    });
    return loans;
  }

  async findOne(userId: string, id: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id }, include: { emiHistory: true } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.userId !== userId) throw new ForbiddenException();
    return loan;
  }

  async update(userId: string, id: string, dto: Partial<CreateLoanDto>) {
    await this.findOne(userId, id);
    const score = computePriorityScore(
      dto.interestRate ?? 0,
      dto.overdueDays ?? 0,
      dto.penaltyRate ?? 0,
    );
    return this.prisma.loan.update({
      where: { id },
      data: { ...dto, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined, priorityScore: score },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.loan.delete({ where: { id } });
  }

  // ── Priority Engine: sorted repayment recommendations ──
  async getPriorityOrder(userId: string) {
    const loans = await this.prisma.loan.findMany({
      where: { userId, status: { in: ['ACTIVE', 'OVERDUE'] } },
    });

    const scored = loans.map((l) => ({
      ...l,
      priorityScore: computePriorityScore(l.interestRate, l.overdueDays, l.penaltyRate),
      explanation: getPriorityExplanation(l),
    })).sort((a, b) => b.priorityScore - a.priorityScore);

    const totalEmi = scored.reduce((s, l) => s + l.emiAmount, 0);
    const totalOutstanding = scored.reduce((s, l) => s + l.outstandingAmount, 0);

    return {
      loans: scored,
      summary: {
        totalOutstanding,
        totalMonthlyEmi: totalEmi,
        highPriorityCount: scored.filter((l) => l.priorityScore >= 20).length,
        overdueCount: scored.filter((l) => l.overdueDays > 0).length,
      },
      recommendation: scored.length > 0
        ? `Focus on "${scored[0].loanName}" first — priority score ${scored[0].priorityScore.toFixed(1)}. ${scored[0].explanation}`
        : 'No active loans found.',
    };
  }

  async getDashboardSummary(userId: string) {
    const loans = await this.prisma.loan.findMany({ where: { userId } });
    const totalDebt = loans.reduce((s, l) => s + l.outstandingAmount, 0);
    const monthlyEmi = loans.filter((l) => ['ACTIVE', 'OVERDUE'].includes(l.status)).reduce((s, l) => s + l.emiAmount, 0);
    const overdueLoans = loans.filter((l) => l.overdueDays > 0);
    return { totalDebt, monthlyEmi, loanCount: loans.length, overdueCount: overdueLoans.length, loans };
  }
}
