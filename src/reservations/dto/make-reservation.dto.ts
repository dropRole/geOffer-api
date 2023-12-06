import { IsUUID } from 'class-validator';

export default class MakeReservationDTO {
  @IsUUID()
  idRequest: string;
}
