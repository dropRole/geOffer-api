import {
  IsNotEmpty,
  IsNumberString,
  IsString,
  IsOptional,
} from 'class-validator';

export default class AmendRequestProvisionsDTO {
  @IsNotEmpty()
  @IsNumberString()
  seats: number;

  @IsNotEmpty()
  @IsString()
  cause: string;

  @IsOptional()
  @IsString()
  note?: string;
}
