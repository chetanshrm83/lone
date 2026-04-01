import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

interface FinancialContext {
  income: number;
  totalExpenses: number;
  totalDebt: number;
  monthlyEmi: number;
  overdueLoans: any[];
  investments: any[];
  surplus: number;
  debtToIncomeRatio: number;
}

// ─── Rule Engine ───────────────────────────────────────────────────────────
function runRuleEngine(ctx: FinancialContext) {
  const rules: { condition: boolean; action: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }[] = [
    { condition: ctx.debtToIncomeRatio > 0.5, action: 'Debt-to-income ratio is critically high (>50%). Prioritise debt reduction before any new spending or investment.', priority: 'HIGH' },
    { condition: ctx.overdueLoans.length > 0, action: `${ctx.overdueLoans.length} loan(s) are overdue. Contact lenders immediately to avoid compounding penalties.`, priority: 'HIGH' },
    { condition: ctx.surplus < 0, action: 'Monthly expenses exceed income. Immediate expense audit required — cut discretionary spend.', priority: 'HIGH' },
    { condition: ctx.surplus > 0 && ctx.surplus < 5000, action: 'Surplus is very thin. Build an emergency fund of at least 3× monthly expenses before investing.', priority: 'MEDIUM' },
    { condition: ctx.totalDebt > ctx.income * 12, action: 'Total debt exceeds annual income. Consider debt consolidation or structured repayment plan.', priority: 'MEDIUM' },
    { condition: ctx.investments.length === 0 && ctx.surplus > 10000, action: 'No active investments found. Begin SIP of at least ₹2,000/month for long-term wealth.', priority: 'MEDIUM' },
    { condition: ctx.debtToIncomeRatio < 0.3 && ctx.surplus > 15000, action: 'Financial position is healthy. Increase SIP contributions or add PPF for tax efficiency.', priority: 'LOW' },
  ];
  return rules.filter((r) => r.condition).map(({ condition, ...rest }) => rest);
}

function buildCashAllocation(surplus: number, overdueLoans: any[]) {
  if (surplus <= 0) return [];
  const allocs: { label: string; amount: number; reason: string }[] = [];
  let remaining = surplus;

  // 1. Overdue loans first
  if (overdueLoans.length > 0) {
    const overdueAmt = Math.min(remaining * 0.5, overdueLoans.reduce((s: number, l: any) => s + l.emiAmount, 0));
    allocs.push({ label: 'Overdue EMI catch-up', amount: Math.round(overdueAmt), reason: 'Prevent penalty compounding' });
    remaining -= overdueAmt;
  }

  // 2. Emergency fund (target 3 months expenses)
  if (remaining > 5000) {
    const emergAmt = Math.round(remaining * 0.3);
    allocs.push({ label: 'Emergency fund', amount: emergAmt, reason: 'Build 3-month safety buffer' });
    remaining -= emergAmt;
  }

  // 3. SIP investment
  if (remaining > 3000) {
    const sipAmt = Math.round(remaining * 0.4);
    allocs.push({ label: 'SIP Investment', amount: sipAmt, reason: 'Long-term wealth creation' });
    remaining -= sipAmt;
  }

  // 4. PPF / Tax saving
  if (remaining > 1000) {
    allocs.push({ label: 'PPF / 80C saving', amount: Math.round(remaining), reason: 'Tax savings + guaranteed returns' });
  }
  return allocs;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private prisma: PrismaService) {}

  private async buildContext(userId: string): Promise<FinancialContext> {
    const [user, loans, txs, investments] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.loan.findMany({ where: { userId, status: { in: ['ACTIVE', 'OVERDUE'] } } }),
      this.prisma.transaction.findMany({ where: { userId, date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      this.prisma.investment.findMany({ where: { userId, isActive: true } }),
    ]);

    const income = user?.monthlyIncome || 0;
    const totalExpenses = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const totalDebt = loans.reduce((s, l) => s + l.outstandingAmount, 0);
    const monthlyEmi = loans.reduce((s, l) => s + l.emiAmount, 0);
    const overdueLoans = loans.filter((l) => l.overdueDays > 0);
    const surplus = income - totalExpenses - monthlyEmi;

    return {
      income, totalExpenses, totalDebt, monthlyEmi,
      overdueLoans, investments,
      surplus: Math.max(0, surplus),
      debtToIncomeRatio: income > 0 ? monthlyEmi / income : 0,
    };
  }

  // ── AI Stress Score (0–100) ────────────────────────────────────────────────
  async getStressScore(userId: string) {
    const ctx = await this.buildContext(userId);
    let score = 0;
    if (ctx.debtToIncomeRatio > 0.6) score += 35;
    else if (ctx.debtToIncomeRatio > 0.4) score += 20;
    else if (ctx.debtToIncomeRatio > 0.25) score += 10;

    if (ctx.overdueLoans.length > 2) score += 30;
    else if (ctx.overdueLoans.length > 0) score += 15;

    if (ctx.surplus < 0) score += 25;
    else if (ctx.surplus < 5000) score += 10;

    if (ctx.investments.length === 0) score += 5;
    if (ctx.totalDebt > ctx.income * 24) score += 5;

    const capped = Math.min(score, 100);
    const label = capped >= 70 ? 'Critical' : capped >= 40 ? 'High' : capped >= 20 ? 'Moderate' : 'Healthy';
    return { score: capped, label, context: ctx };
  }

  // ── Hybrid Decision Engine ─────────────────────────────────────────────────
  async getDecision(userId: string) {
    const ctx = await this.buildContext(userId);
    const rules = runRuleEngine(ctx);
    const allocation = buildCashAllocation(ctx.surplus, ctx.overdueLoans);

    // LLM enhancement
    let llmSuggestion = '';
    try {
      llmSuggestion = await this.callOpenAI(
        `You are a financial advisor. Given: income=₹${ctx.income}, EMI=₹${ctx.monthlyEmi}, surplus=₹${ctx.surplus}, debt=₹${ctx.totalDebt}, overdue_loans=${ctx.overdueLoans.length}. Provide 2-3 concise, actionable sentences. Be specific with rupee amounts. No generic advice.`,
        'decision',
      );
    } catch (e) {
      this.logger.warn('OpenAI unavailable, using rule engine only');
    }

    return {
      disclaimer: 'This is financial guidance, not regulated financial advice. Consult a certified financial advisor for major decisions.',
      context: { income: ctx.income, monthlyEmi: ctx.monthlyEmi, surplus: ctx.surplus, debtToIncomeRatio: `${(ctx.debtToIncomeRatio * 100).toFixed(1)}%` },
      ruleBasedActions: rules,
      cashAllocation: allocation,
      aiSuggestion: llmSuggestion,
    };
  }

  // ── AI Chat Advisor ────────────────────────────────────────────────────────
  async chat(userId: string, conversationId: string | null, message: string) {
    const ctx = await this.buildContext(userId);

    let convId = conversationId;
    if (!convId) {
      const conv = await this.prisma.aiConversation.create({
        data: { userId, title: message.slice(0, 50) },
      });
      convId = conv.id;
    }

    await this.prisma.aiMessage.create({
      data: { conversationId: convId, role: 'USER', content: message },
    });

    const history = await this.prisma.aiMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const systemPrompt = `You are FinGuardian AI — a helpful, empathetic financial advisor. You always give structured, actionable advice.

USER FINANCIAL CONTEXT:
- Monthly Income: ₹${ctx.income.toLocaleString('en-IN')}
- Monthly EMI Burden: ₹${ctx.monthlyEmi.toLocaleString('en-IN')} (${(ctx.debtToIncomeRatio * 100).toFixed(1)}% of income)
- Monthly Expenses: ₹${ctx.totalExpenses.toLocaleString('en-IN')}
- Monthly Surplus: ₹${ctx.surplus.toLocaleString('en-IN')}
- Total Outstanding Debt: ₹${ctx.totalDebt.toLocaleString('en-IN')}
- Overdue Loans: ${ctx.overdueLoans.length}
- Active Investments: ${ctx.investments.length}

RULES:
1. Always give specific, actionable advice with rupee amounts
2. Prioritise debt reduction when DTI > 40%
3. Never recommend specific stocks or execute trades
4. Add disclaimers for regulated actions
5. Be empathetic — many users are under financial stress
6. Structure responses with clear sections when complex`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role.toLowerCase() as 'user' | 'assistant', content: m.content })),
    ];

    let response = '';
    try {
      response = await this.callOpenAI(messages as any, 'chat');
    } catch {
      response = this.getRuleBasedResponse(ctx, message);
    }

    await this.prisma.aiMessage.create({
      data: { conversationId: convId, role: 'ASSISTANT', content: response },
    });

    return { conversationId: convId, response, disclaimer: 'FinGuardian AI provides financial guidance, not regulated financial advice.' };
  }

  private getRuleBasedResponse(ctx: FinancialContext, message: string): string {
    if (message.toLowerCase().includes('invest')) {
      return ctx.surplus > 5000
        ? `Based on your ₹${ctx.surplus.toLocaleString('en-IN')} monthly surplus, I recommend starting a SIP of ₹${Math.round(ctx.surplus * 0.3).toLocaleString('en-IN')}/month in a diversified equity fund. This would balance your EMI commitments while building long-term wealth.`
        : 'Your current surplus is limited. Focus on clearing overdue loans first before starting investments. Once EMI burden reduces, begin a small SIP of ₹500–1,000/month.';
    }
    if (ctx.overdueLoans.length > 0) {
      return `You have ${ctx.overdueLoans.length} overdue loan(s) requiring immediate attention. Contact your lender to negotiate a payment plan. Clearing overdues prevents legal action and credit score damage.`;
    }
    return `Your debt-to-income ratio is ${(ctx.debtToIncomeRatio * 100).toFixed(1)}%. ${ctx.debtToIncomeRatio < 0.35 ? 'This is manageable — focus on building an emergency fund and SIP.' : 'This is high — prioritise EMI payments and reduce discretionary expenses.'}`;
  }

  private async callOpenAI(input: string | any[], type: 'chat' | 'decision'): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

    const messages = typeof input === 'string'
      ? [{ role: 'user', content: input }]
      : input;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 800, temperature: 0.4 }),
    });

    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
    const data = await res.json() as any;
    return data.choices[0].message.content;
  }

  async getConversations(userId: string) {
    return this.prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true },
    });
  }

  async getMessages(userId: string, convId: string) {
    const conv = await this.prisma.aiConversation.findFirst({ where: { id: convId, userId } });
    if (!conv) return [];
    return this.prisma.aiMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
