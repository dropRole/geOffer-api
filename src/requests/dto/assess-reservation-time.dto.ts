import { IsDateString } from 'class-validator';

export default class AssessReservationTimeDTO {
  @IsDateString()
  assessment: string;
}
