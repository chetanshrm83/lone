import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private ai: AiService) {}

  @Get('stress-score')
  stressScore(@Request() req: any) { return this.ai.getStressScore(req.user.userId); }

  @Get('decision')
  decision(@Request() req: any) { return this.ai.getDecision(req.user.userId); }

  @Post('chat')
  chat(@Request() req: any, @Body() body: { message: string; conversationId?: string }) {
    return this.ai.chat(req.user.userId, body.conversationId || null, body.message);
  }

  @Get('conversations')
  conversations(@Request() req: any) { return this.ai.getConversations(req.user.userId); }

  @Get('conversations/:id/messages')
  messages(@Request() req: any, @Param('id') id: string) { return this.ai.getMessages(req.user.userId, id); }
}
