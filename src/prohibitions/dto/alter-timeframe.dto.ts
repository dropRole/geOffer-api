import { IsDateString } from 'class-validator';

export default class AlterTimeframeDTO {
  @IsDateString()
  termination: string;
}
