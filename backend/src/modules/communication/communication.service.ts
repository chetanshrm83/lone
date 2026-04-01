import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { GenerateScriptDto } from './dto/generate-script.dto';

const SCRIPT_TEMPLATES = {
  CALL: {
    POLITE: `Good [time of day]. My name is [YOUR NAME] and I am calling regarding the account under my name. I acknowledge that there is an outstanding balance and I genuinely intend to resolve this. I am currently experiencing temporary financial difficulty and would like to discuss a structured repayment arrangement. Could you please connect me with your accounts resolution team?`,
    FIRM: `This is [YOUR NAME]. I am calling regarding correspondence about an alleged debt. I request that all communication be in writing only, sent to my registered address. I do not acknowledge or admit any debt at this time. Please note this call and confirm your company's official correspondence address.`,
    LEGAL_AWARE: `This is [YOUR NAME]. Under consumer protection regulations, I have the right to request written validation of this debt. I am requesting that you cease verbal contact and communicate only in writing. Any further calls may be logged and I reserve the right to file a complaint with the relevant financial ombudsman if communication guidelines are violated.`,
  },
  EMAIL: {
    POLITE: `Subject: Request for Repayment Arrangement — Account [ACCOUNT NUMBER]\n\nDear [CREDITOR NAME] Collections Team,\n\nI am writing regarding the outstanding balance on my account. I acknowledge this obligation and am committed to resolving it. Due to temporary financial hardship, I request your consideration for a structured repayment plan.\n\nI am able to offer ₹[AMOUNT] per month commencing [DATE]. Please confirm if this arrangement is acceptable and provide a written agreement.\n\nThank you for your understanding.\n\nRegards,\n[YOUR NAME]`,
    FIRM: `Subject: Written Communication Request — Account [ACCOUNT NUMBER]\n\nTo Whom It May Concern,\n\nI am writing in response to your recent contact regarding an alleged debt. I request that all future communication be conducted exclusively in writing. I have not acknowledged or admitted to any debt in any prior verbal communications.\n\nPlease provide written documentation including: original creditor details, full account history, and validation of the debt amount.\n\nRegards,\n[YOUR NAME]`,
    LEGAL_AWARE: `Subject: Formal Debt Validation Request — Account [ACCOUNT NUMBER]\n\nDear Sir/Madam,\n\nPursuant to my rights under applicable consumer protection and debt collection regulations, I hereby formally request written validation of the alleged debt associated with my account.\n\nI specifically request: (1) Original signed agreement, (2) Complete payment history, (3) Current balance breakdown with interest and charges, (4) Your company's authorisation to collect this debt.\n\nUntil this validation is provided, all collection activity must cease. Continued contact without validation may constitute a violation of consumer protection laws.\n\nYours faithfully,\n[YOUR NAME]`,
  },
};

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(private prisma: PrismaService) {}

  async generateScript(userId: string, dto: GenerateScriptDto) {
    const baseScript = SCRIPT_TEMPLATES[dto.type as keyof typeof SCRIPT_TEMPLATES]?.[dto.tone] || 'Template not available for this combination.';

    let aiEnhancement = '';
    try {
      aiEnhancement = await this.callOpenAI(
        `Enhance this ${dto.tone.toLowerCase()} ${dto.type.toLowerCase()} script for dealing with a collection agent from "${dto.source}". Keep it professional, legally safe, and under 200 words. Additional context: ${dto.context || 'general debt collection'}\n\nBase template:\n${baseScript}`,
      );
    } catch {
      this.logger.warn('OpenAI unavailable, using base template');
      aiEnhancement = baseScript;
    }

    const log = await this.prisma.communicationLog.create({
      data: {
        userId,
        type: 'GENERATED_SCRIPT',
        source: dto.source,
        content: aiEnhancement || baseScript,
        tone: dto.tone,
        isIncoming: false,
        exportReady: true,
      },
    });

    return {
      script: aiEnhancement || baseScript,
      logId: log.id,
      disclaimer: 'This script is a communication aid. It does not constitute legal advice. Consult a lawyer for serious legal matters.',
    };
  }

  async logCommunication(userId: string, data: { type: any; source: string; content: string; isIncoming: boolean }) {
    return this.prisma.communicationLog.create({ data: { ...data, userId } });
  }

  async getLogs(userId: string) {
    return this.prisma.communicationLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async exportLog(userId: string, id: string) {
    const log = await this.prisma.communicationLog.findFirst({ where: { id, userId } });
    if (!log) throw new Error('Log not found');
    return {
      id: log.id,
      type: log.type,
      source: log.source,
      content: log.content,
      tone: log.tone,
      createdAt: log.createdAt,
      exportFormat: 'text/plain',
    };
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('No API key');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 500 }),
    });
    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
    const data = await res.json() as any;
    return data.choices[0].message.content;
  }
}
