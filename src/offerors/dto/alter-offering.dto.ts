import { IsNotEmpty, IsString } from 'class-validator';

export class AlterOfferingDTO {
  @IsString()
  @IsNotEmpty()
  offers: string;
}
