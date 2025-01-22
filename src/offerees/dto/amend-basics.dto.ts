import { IsNotEmpty, MaxLength, IsEmail, IsString } from 'class-validator';

export default class AmendBasicsDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsString()
  surname: string;

  @IsEmail()
  @MaxLength(254)
  email: string;
}
