import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ScriptTone, CommunicationType } from '@prisma/client';
export class GenerateScriptDto {
  @IsEnum(CommunicationType) type: CommunicationType;
  @IsString() source: string;
  @IsEnum(ScriptTone) tone: ScriptTone;
  @IsOptional() @IsString() context?: string;
}
