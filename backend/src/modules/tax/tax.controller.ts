import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TaxService } from './tax.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('tax')
@UseGuards(JwtAuthGuard)
export class TaxController {
  constructor(private tax: TaxService) {}
  @Post('calculate')
  calculate(@Body() body: { annualIncome: number; deductions: Record<string, number> }) {
    return this.tax.calculate(body.annualIncome, body.deductions || {});
  }
}
