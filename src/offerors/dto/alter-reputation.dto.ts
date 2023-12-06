import { IsNotEmpty, IsNumberString } from 'class-validator';

export default class AlterReputationDTO {
  @IsNotEmpty()
  @IsNumberString()
  responsiveness: number;

  @IsNotEmpty()
  @IsNumberString()
  compliance: number;

  @IsNotEmpty()
  @IsNumberString()
  timeliness: number;
}
