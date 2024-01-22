import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export default class WriteComplaintDTO {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsUUID()
  @IsOptional()
  idCounteredComplaint: string;

  @IsUUID()
  idIncident: string;
}
