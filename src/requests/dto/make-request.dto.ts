import {
  IsNotEmpty,
  IsNumberString,
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
} from 'class-validator';

export default class MakeRequestDTO {
  @IsNotEmpty()
  @IsNumberString()
  seats: number;

  @IsNotEmpty()
  @IsString()
  cause: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsDateString()
  requestedFor: string;

  @IsUUID()
  idOfferor: string;
}
