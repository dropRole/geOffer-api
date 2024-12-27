import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class AlterServiceInfoDTO {
  @IsOptional()
  @IsString()
  detailed: string;

  @IsOptional()
  @IsNumberString()
  price: number;
}
