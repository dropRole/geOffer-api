import { MinLength, MaxLength, Matches } from 'class-validator';

export default class LoginDTO {
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
