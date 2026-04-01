import { IsEmail, IsString, MinLength, IsOptional, IsNumber, Min } from 'class-validator';

export class RegisterDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @MinLength(8) password: string;
  @IsOptional() @IsNumber() @Min(0) monthlyIncome?: number;
}
