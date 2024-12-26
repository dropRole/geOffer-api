import {
  IsNotEmpty,
  MaxLength,
  IsJSON,
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';

export default class AmendBusinessInfoDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsJSON()
  address: string;

  @IsJSON()
  coordinates: string;

  @IsNotEmpty()
  @MaxLength(15)
  telephone: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsJSON()
  businessHours?: string;
}
