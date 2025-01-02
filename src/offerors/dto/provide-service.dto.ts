import {
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class ProvideServiceDTO {
  @IsIn(['Seat reservation', 'Ticket selling'])
  category: string;

  @IsOptional()
  @IsString()
  detailed: string;

  @IsNumberString()
  price: number;

  @IsOptional()
  @IsUUID()
  idEvent: string;
}
