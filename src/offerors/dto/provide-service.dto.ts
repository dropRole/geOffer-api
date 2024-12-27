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

  @IsString()
  @IsNotEmpty()
  detailed: string;

  @IsNumberString()
  price: number;

  @IsOptional()
  @IsUUID()
  idEvent: string;
}
