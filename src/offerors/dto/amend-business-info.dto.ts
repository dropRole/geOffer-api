import {
  IsNotEmpty,
  MaxLength,
  IsJSON,
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';

export default class AmendBusinessInfoDTO {
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsJSON()
  address: string;

  @IsNotEmpty()
  @MaxLength(15)
  telephone: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsOptional()
  @IsString()
  businessHours?: string;
}
