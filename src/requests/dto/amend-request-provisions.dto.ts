import { IsString, IsOptional } from 'class-validator';

export default class AmendRequestProvisionsDTO {
  @IsOptional()
  @IsString()
  note?: string;
}
