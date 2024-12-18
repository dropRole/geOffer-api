import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class AddEventDTO {
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  beginning: string;

  @IsDateString()
  conclusion: string;

  @IsUUID()
  idOfferor: string;
}
