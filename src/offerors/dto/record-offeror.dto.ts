import {
  IsNotEmpty,
  MaxLength,
  IsJSON,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsIn,
} from 'class-validator';

export default class RecordOfferorDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(['Restaurant', 'Café/ Pub', 'Movie Theater'])
  category: string;

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
