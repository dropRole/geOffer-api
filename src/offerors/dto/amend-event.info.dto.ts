import { IsDateString, IsOptional, IsString } from 'class-validator';

export class AmendEventInfoDTO {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  detailed: string;

  @IsOptional()
  @IsDateString()
  beginning: string;

  @IsOptional()
  @IsDateString()
  conclusion: string;
}
