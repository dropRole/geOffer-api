import {
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class AlterServiceProductInfoDTO {
  @IsOptional()
  @IsString()
  serviceProduct: string;

  @IsOptional()
  @IsString()
  detailed: string;

  @IsOptional()
  @IsNumberString()
  price: number;
}
