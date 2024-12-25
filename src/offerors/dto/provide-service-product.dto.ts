import {
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class ProvideServiceProductDTO {
  @IsString()
  @IsNotEmpty()
  serviceProduct: string;

  @IsIn(['Dinning', 'Drink order', 'Ticket selling'])
  category: string;

  @IsString()
  @IsNotEmpty()
  detailed: string;

  @IsNumberString()
  price: number;

  @IsOptional()
  @IsUUID()
  idServiceProduct: string;

  @IsOptional()
  @IsUUID()
  idEvent: string;
}
