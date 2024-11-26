import { IsNotEmpty, IsString } from 'class-validator';

export class AlterOfferingDTO {
  @IsString()
  @IsNotEmpty()
  offer: string;
}
