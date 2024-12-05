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
  @IsIn(['Dinning', 'Drinking', 'Ticket selling'])
  service: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  requestedFor: string;

  @IsUUID()
  idOfferor: string;
}
