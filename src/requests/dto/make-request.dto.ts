import {
  IsNotEmpty,
  IsNumberString,
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsIn,
} from 'class-validator';

export default class MakeRequestDTO {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  requestedFor: string;

  @IsNumberString()
  amount: number;

  @IsUUID()
  idOfferorService: string;
}
