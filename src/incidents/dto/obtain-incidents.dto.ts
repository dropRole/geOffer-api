import { IsOptional, IsIn } from 'class-validator';
import IncidentStatus from '../types';

export default class ObtainIncidentsDTO {
  @IsOptional()
  @IsIn(['PENDING', 'RESOLVED', 'REJECTED'])
  status: IncidentStatus;
}
