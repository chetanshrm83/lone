import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './config/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LoansModule } from './modules/loans/loans.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { AiModule } from './modules/ai/ai.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { TaxModule } from './modules/tax/tax.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    LoansModule,
    TransactionsModule,
    InvestmentsModule,
    AiModule,
    CommunicationModule,
    TaxModule,
    HealthModule,
  ],
})
export class AppModule {}
