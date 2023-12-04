import { IsNotEmpty, MaxLength, IsEmail } from 'class-validator';

export default class AmendBasicsDTO {
  @IsNotEmpty()
  @MaxLength(35)
  name: string;

  @IsNotEmpty()
  @MaxLength(35)
  surname: string;

  @IsEmail()
  @MaxLength(254)
  email: string;
}
