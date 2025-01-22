import {
  IsNotEmpty,
  MaxLength,
  IsEmail,
  MinLength,
  Matches,
  IsString,
} from 'class-validator';

export default class SignupDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  surname: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

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
