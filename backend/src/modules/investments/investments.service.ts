import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';

// SIP Calculator: FV = P × [((1+r)^n - 1)/r] × (1+r)
function sipFV(monthly: number, annualRate: number, months: number): number {
  const r = annualRate / 100 / 12;
  return monthly * (((Math.pow(1 + r, months) - 1) / r) * (1 + r));
}

// FD Calculator: FV = P × (1 + r/4)^(4n)  quarterly compounding
function fdFV(principal: number, annualRate: number, years: number): number {
  return principal * Math.pow(1 + annualRate / 400, 4 * years);
}

// Government scheme comparison rates (2024)
const GOVT_RATES: Record<string, number> = { PPF: 7.1, NSC: 7.7, SUKANYA_SAMRIDDHI: 8.2, SENIOR_CITIZEN_SAVINGS: 8.2 };

@Injectable()
export class InvestmentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateInvestmentDto) {
    const rate = dto.expectedReturn || 12;
    const maturity = sipFV(dto.monthlyAmount, rate, dto.duration);
    return this.prisma.investment.create({
      data: { ...dto, userId, expectedReturn: rate, maturityAmount: maturity },
    });
  }

  async findAll(userId: string) {
    return this.prisma.investment.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async remove(userId: string, id: string) {
    return this.prisma.investment.delete({ where: { id, userId } });
  }

  // Investment calculator - educational
  calculateProjection(monthly: number, annualRate: number, durationMonths: number) {
    const sipResult = sipFV(monthly, annualRate, durationMonths);
    const invested = monthly * durationMonths;
    const years = durationMonths / 12;

    const comparisons = [
      { type: 'SIP (Mutual Fund)', rate: annualRate, maturity: sipFV(monthly, annualRate, durationMonths), label: 'Market-linked' },
      { type: 'FD (Bank)', rate: 7, maturity: fdFV(invested, 7, years), label: 'Fixed return' },
      { type: 'PPF', rate: GOVT_RATES.PPF, maturity: fdFV(invested, GOVT_RATES.PPF, years), label: 'Tax-free, Govt backed' },
      { type: 'NSC', rate: GOVT_RATES.NSC, maturity: fdFV(invested, GOVT_RATES.NSC, years), label: 'Govt backed, 80C' },
    ];

    const monthlyGrowth = [];
    for (let m = 1; m <= Math.min(durationMonths, 60); m += Math.ceil(durationMonths / 12)) {
      monthlyGrowth.push({
        month: m,
        value: Math.round(sipFV(monthly, annualRate, m)),
        invested: monthly * m,
      });
    }

    return {
      disclaimer: 'Educational estimates only. Returns are not guaranteed. Consult a financial advisor.',
      sipProjection: {
        monthlyInvestment: monthly,
        annualReturn: annualRate,
        durationMonths,
        totalInvested: invested,
        estimatedMaturity: Math.round(sipResult),
        totalReturns: Math.round(sipResult - invested),
        absoluteReturn: `${(((sipResult - invested) / invested) * 100).toFixed(1)}%`,
      },
      comparisons: comparisons.map((c) => ({ ...c, maturity: Math.round(c.maturity), returns: Math.round(c.maturity - invested) })),
      monthlyGrowth,
    };
  }
}
