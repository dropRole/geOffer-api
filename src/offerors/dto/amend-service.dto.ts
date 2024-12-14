import { IsJSON } from 'class-validator';

export class AmendServiceDTO {
  @IsJSON()
  service: string;
}
