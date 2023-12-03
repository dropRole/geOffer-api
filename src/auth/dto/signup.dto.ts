import {
  IsNotEmpty,
  MaxLength,
  IsEmail,
  MinLength,
  Matches,
} from 'class-validator';

export default class SignupDTO {
  @IsNotEmpty()
  @MaxLength(35)
  name: string;

  @IsNotEmpty()
  @MaxLength(35)
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
