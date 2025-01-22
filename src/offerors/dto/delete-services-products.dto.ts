import { IsJSON } from 'class-validator';

export class DeleteServicesDTO {
  @IsJSON()
  serviceIds: string;
}
