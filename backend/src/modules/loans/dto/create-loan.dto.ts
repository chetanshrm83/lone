import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { LoanType } from '@prisma/client';

export class CreateLoanDto {
  @IsString() loanName: string;
  @IsOptional() @IsString() lenderName?: string;
  @IsNumber() @Min(0) totalAmount: number;
  @IsNumber() @Min(0) outstandingAmount: number;
  @IsNumber() @Min(0) @Max(100) interestRate: number;
  @IsNumber() @Min(0) emiAmount: number;
  @IsDateString() dueDate: string;
  @IsOptional() @IsNumber() @Min(0) overdueDays?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) penaltyRate?: number;
  @IsOptional() @IsEnum(LoanType) loanType?: LoanType;
  @IsOptional() @IsString() notes?: string;
}
