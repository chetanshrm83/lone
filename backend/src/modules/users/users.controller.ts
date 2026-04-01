import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}
  @Get('dashboard') dashboard(@Request() req: any) { return this.users.getDashboard(req.user.userId); }
  @Put('profile') update(@Request() req: any, @Body() body: any) { return this.users.updateProfile(req.user.userId, body); }
}
