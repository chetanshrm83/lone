import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    return this.prisma.transaction.create({ data: { ...dto, userId, date: new Date(dto.date) } });
  }

  async findAll(userId: string, limit = 50) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async getMonthlySummary(userId: string) {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const txs = await this.prisma.transaction.findMany({
        where: { userId, date: { gte: d, lte: end } },
      });
      const income = txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
      const expense = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
      months.push({ month: d.toLocaleString('default', { month: 'short', year: '2-digit' }), income, expense, net: income - expense });
    }
    return months;
  }

  async getCategoryBreakdown(userId: string) {
    const currentMonth = new Date();
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const expenses = await this.prisma.transaction.findMany({
      where: { userId, type: 'EXPENSE', date: { gte: start } },
    });
    const breakdown: Record<string, number> = {};
    expenses.forEach((t) => { breakdown[t.category] = (breakdown[t.category] || 0) + t.amount; });
    return Object.entries(breakdown).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  }
}
