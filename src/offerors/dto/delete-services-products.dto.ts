import { IsJSON } from 'class-validator';

export class DeleteServicesProductsDTO {
  @IsJSON()
  serviceProductIds: string;
}
