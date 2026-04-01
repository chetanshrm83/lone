import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { GenerateScriptDto } from './dto/generate-script.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('communication')
@UseGuards(JwtAuthGuard)
export class CommunicationController {
  constructor(private service: CommunicationService) {}
  @Post('generate') generate(@Request() req: any, @Body() dto: GenerateScriptDto) { return this.service.generateScript(req.user.userId, dto); }
  @Post('log') log(@Request() req: any, @Body() body: any) { return this.service.logCommunication(req.user.userId, body); }
  @Get('logs') logs(@Request() req: any) { return this.service.getLogs(req.user.userId); }
  @Get('export/:id') export_(@Request() req: any, @Param('id') id: string) { return this.service.exportLog(req.user.userId, id); }
}
