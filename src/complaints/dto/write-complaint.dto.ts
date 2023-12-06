import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export default class WriteComplaintDTO {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsUUID()
  idIncident: string;
}
