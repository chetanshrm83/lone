import { IsString, IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { InvestmentType } from '@prisma/client';
export class CreateInvestmentDto {
  @IsString() name: string;
  @IsEnum(InvestmentType) type: InvestmentType;
  @IsNumber() @Min(100) monthlyAmount: number;
  @IsOptional() @IsNumber() @Min(1) @Max(50) expectedReturn?: number;
  @IsNumber() @Min(1) duration: number; // months
  @IsOptional() @IsString() notes?: string;
}
