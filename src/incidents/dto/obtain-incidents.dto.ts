import { IsOptional, IsIn } from 'class-validator';
import { IncidentStatus } from '../entities/incident.entity';

export default class ObtainIncidentsDTO {
  @IsOptional()
  @IsIn(['PENDING', 'RESOLVED', 'REJECTED'])
  status: IncidentStatus;
}
