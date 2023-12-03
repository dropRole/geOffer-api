import { MinLength, MaxLength } from 'class-validator';

export default class AlterUsernameDTO {
  @MinLength(8)
  @MaxLength(20)
  username: string;
}
