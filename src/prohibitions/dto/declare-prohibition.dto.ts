import { IsDateString, IsUUID } from 'class-validator';

export default class DeclareProhibitionDTO {
  @IsDateString()
  beginning: string;

  @IsDateString()
  termination: string;

  @IsUUID()
  idIncident: string;
}
