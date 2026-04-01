import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: string, data: { name?: string; monthlyIncome?: number; riskProfile?: any }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, monthlyIncome: true, riskProfile: true },
    });
  }

  async getDashboard(userId: string) {
    const [user, loans, txs, investments] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.loan.findMany({ where: { userId } }),
      this.prisma.transaction.findMany({ where: { userId, date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      this.prisma.investment.findMany({ where: { userId, isActive: true } }),
    ]);
    const totalDebt = loans.reduce((s, l) => s + l.outstandingAmount, 0);
    const monthlyEmi = loans.filter((l) => ['ACTIVE', 'OVERDUE'].includes(l.status)).reduce((s, l) => s + l.emiAmount, 0);
    const income = txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0) || user?.monthlyIncome || 0;
    const expenses = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const netBalance = income - expenses - monthlyEmi;
    return { totalDebt, monthlyEmi, income, expenses, netBalance, loanCount: loans.length, investmentCount: investments.length, overdueCount: loans.filter((l) => l.overdueDays > 0).length };
  }
}
