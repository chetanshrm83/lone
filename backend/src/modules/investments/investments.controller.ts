import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('investments')
@UseGuards(JwtAuthGuard)
export class InvestmentsController {
  constructor(private service: InvestmentsService) {}
  @Post() create(@Request() req: any, @Body() dto: CreateInvestmentDto) { return this.service.create(req.user.userId, dto); }
  @Get() findAll(@Request() req: any) { return this.service.findAll(req.user.userId); }
  @Delete(':id') remove(@Request() req: any, @Param('id') id: string) { return this.service.remove(req.user.userId, id); }
  @Get('calculate')
  calculate(@Query('monthly') m: string, @Query('rate') r: string, @Query('months') mo: string) {
    return this.service.calculateProjection(+m || 5000, +r || 12, +mo || 60);
  }
}
