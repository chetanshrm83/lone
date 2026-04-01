import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('loans')
@UseGuards(JwtAuthGuard)
export class LoansController {
  constructor(private loansService: LoansService) {}

  @Post() create(@Request() req: any, @Body() dto: CreateLoanDto) {
    return this.loansService.create(req.user.userId, dto);
  }
  @Get() findAll(@Request() req: any) { return this.loansService.findAll(req.user.userId); }
  @Get('priority') getPriority(@Request() req: any) { return this.loansService.getPriorityOrder(req.user.userId); }
  @Get('dashboard') getDashboard(@Request() req: any) { return this.loansService.getDashboardSummary(req.user.userId); }
  @Get(':id') findOne(@Request() req: any, @Param('id') id: string) { return this.loansService.findOne(req.user.userId, id); }
  @Put(':id') update(@Request() req: any, @Param('id') id: string, @Body() dto: Partial<CreateLoanDto>) {
    return this.loansService.update(req.user.userId, id, dto);
  }
  @Delete(':id') remove(@Request() req: any, @Param('id') id: string) { return this.loansService.remove(req.user.userId, id); }
}
