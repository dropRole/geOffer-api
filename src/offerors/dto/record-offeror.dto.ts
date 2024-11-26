import {
  IsNotEmpty,
  MaxLength,
  IsJSON,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export default class RecordOfferorDTO {
  @IsNotEmpty()
  @MaxLength(100)
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

  @IsString()
  @IsNotEmpty()
  offers: string;

  @IsOptional()
  @IsString()
  businessHours?: string;

  @MinLength(8)
  @MaxLength(20)
  username: string;

  @MinLength(10)
  @MaxLength(32)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is fragile',
  })
  password: string;
}
