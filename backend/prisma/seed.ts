import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FinGuardian AI database...');

  // Clean existing data
  await prisma.aiMessage.deleteMany();
  await prisma.aiConversation.deleteMany();
  await prisma.communicationLog.deleteMany();
  await prisma.emiPayment.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.reminderJob.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('Demo@1234', 10);

  const user = await prisma.user.create({
    data: {
      name: 'Arjun Sharma',
      email: 'arjun@demo.com',
      password: hashedPassword,
      monthlyIncome: 75000,
      riskProfile: 'MODERATE',
    },
  });

  console.log('✅ Created demo user:', user.email);

  // Loans
  const loans = await prisma.loan.createMany({
    data: [
      {
        userId: user.id,
        loanName: 'HDFC Personal Loan',
        lenderName: 'HDFC Bank',
        totalAmount: 300000,
        outstandingAmount: 210000,
        interestRate: 18.5,
        emiAmount: 7500,
        dueDate: new Date('2024-02-05'),
        overdueDays: 12,
        penaltyRate: 2,
        loanType: 'PERSONAL',
        status: 'OVERDUE',
        priorityScore: 0,
      },
      {
        userId: user.id,
        loanName: 'SBI Home Loan',
        lenderName: 'SBI',
        totalAmount: 2500000,
        outstandingAmount: 2100000,
        interestRate: 8.5,
        emiAmount: 22000,
        dueDate: new Date('2024-02-10'),
        overdueDays: 0,
        penaltyRate: 0,
        loanType: 'HOME',
        status: 'ACTIVE',
        priorityScore: 0,
      },
      {
        userId: user.id,
        loanName: 'Axis Credit Card',
        lenderName: 'Axis Bank',
        totalAmount: 85000,
        outstandingAmount: 62000,
        interestRate: 36,
        emiAmount: 5000,
        dueDate: new Date('2024-02-01'),
        overdueDays: 18,
        penaltyRate: 3.5,
        loanType: 'CREDIT_CARD',
        status: 'OVERDUE',
        priorityScore: 0,
      },
      {
        userId: user.id,
        loanName: 'Bajaj Vehicle Loan',
        lenderName: 'Bajaj Finance',
        totalAmount: 650000,
        outstandingAmount: 420000,
        interestRate: 12,
        emiAmount: 12000,
        dueDate: new Date('2024-02-15'),
        overdueDays: 0,
        penaltyRate: 1,
        loanType: 'VEHICLE',
        status: 'ACTIVE',
        priorityScore: 0,
      },
    ],
  });

  console.log('✅ Created', loans.count, 'loans');

  // Transactions (last 3 months)
  const txCategories = ['Salary', 'Food', 'Transport', 'Entertainment', 'Medical', 'Shopping', 'Utilities', 'Rent'];
  const txData = [];
  for (let m = 0; m < 3; m++) {
    const d = new Date();
    d.setMonth(d.getMonth() - m);
    txData.push(
      { userId: user.id, type: 'INCOME' as const, amount: 75000, category: 'Salary', description: 'Monthly salary', date: new Date(d.getFullYear(), d.getMonth(), 1) },
      { userId: user.id, type: 'EXPENSE' as const, amount: 12000, category: 'Rent', description: 'House rent', date: new Date(d.getFullYear(), d.getMonth(), 3) },
      { userId: user.id, type: 'EXPENSE' as const, amount: 8000, category: 'Food', description: 'Groceries & dining', date: new Date(d.getFullYear(), d.getMonth(), 10) },
      { userId: user.id, type: 'EXPENSE' as const, amount: 3500, category: 'Transport', description: 'Cab & fuel', date: new Date(d.getFullYear(), d.getMonth(), 15) },
      { userId: user.id, type: 'EXPENSE' as const, amount: 2200, category: 'Utilities', description: 'Electricity, internet', date: new Date(d.getFullYear(), d.getMonth(), 18) },
      { userId: user.id, type: 'EXPENSE' as const, amount: 4500, category: 'Entertainment', description: 'OTT, movies, events', date: new Date(d.getFullYear(), d.getMonth(), 20) },
    );
  }
  const txs = await prisma.transaction.createMany({ data: txData });
  console.log('✅ Created', txs.count, 'transactions');

  // Investments
  const invs = await prisma.investment.createMany({
    data: [
      { userId: user.id, name: 'Mirae Asset Large Cap SIP', type: 'SIP', monthlyAmount: 3000, expectedReturn: 14, duration: 60, notes: 'Long-term wealth creation' },
      { userId: user.id, name: 'SBI FD 1 Year', type: 'FD', monthlyAmount: 50000, expectedReturn: 7, duration: 12, notes: 'Emergency fund parking' },
      { userId: user.id, name: 'PPF Account', type: 'PPF', monthlyAmount: 5000, expectedReturn: 7.1, duration: 180, notes: 'Tax saving under 80C' },
    ],
  });
  console.log('✅ Created', invs.count, 'investments');

  // Communication logs
  const comms = await prisma.communicationLog.createMany({
    data: [
      { userId: user.id, type: 'CALL', source: 'HDFC Recovery Team', content: 'Received call demanding immediate payment of overdue EMI. Caller was aggressive and threatened legal action within 7 days.', isIncoming: true },
      { userId: user.id, type: 'EMAIL', source: 'Axis Bank Collections', content: 'Email received about overdue credit card balance of ₹62,000. Legal notice threatened if not settled within 15 days.', isIncoming: true },
      { userId: user.id, type: 'GENERATED_SCRIPT', source: 'HDFC Recovery Team', content: 'I acknowledge the outstanding dues and wish to resolve this matter. I am currently facing temporary financial difficulty and request a structured repayment plan. I am committed to clearing this debt and respectfully ask for 30 days to arrange the payment.', tone: 'POLITE', isIncoming: false, exportReady: true },
    ],
  });
  console.log('✅ Created', comms.count, 'communication logs');

  console.log('\n🎉 Seed complete!');
  console.log('📧 Demo login: arjun@demo.com');
  console.log('🔑 Password: Demo@1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
