import { IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export default class AlterPasswordDTO {
  @IsOptional()
  @MinLength(10)
  @MaxLength(32)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is fragile',
  })
  password?: string;

  @MinLength(10)
  @MaxLength(32)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is fragile',
  })
  newPassword: string;
}
