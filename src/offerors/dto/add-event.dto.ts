import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class AddEventDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  detailed: string;

  @IsDateString()
  beginning: string;

  @IsOptional()
  @IsDateString()
  conclusion: string;
}
