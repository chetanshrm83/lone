import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private txService: TransactionsService) {}
  @Post() create(@Request() req: any, @Body() dto: CreateTransactionDto) { return this.txService.create(req.user.userId, dto); }
  @Get() findAll(@Request() req: any, @Query('limit') limit?: string) { return this.txService.findAll(req.user.userId, limit ? +limit : 50); }
  @Get('monthly') monthly(@Request() req: any) { return this.txService.getMonthlySummary(req.user.userId); }
  @Get('categories') categories(@Request() req: any) { return this.txService.getCategoryBreakdown(req.user.userId); }
}
