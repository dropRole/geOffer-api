import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export default class OpenIncidentDTO {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUUID()
  idReservation: string;
}
