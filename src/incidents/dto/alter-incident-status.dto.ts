import { IsIn, IsOptional, IsString } from 'class-validator';

export default class AlterIncidentStatusDTO {
  @IsIn(['PENDING', 'RESOLVED', 'REJECTED'])
  status: string;

  @IsOptional()
  @IsString()
  conclusion: string;
}
