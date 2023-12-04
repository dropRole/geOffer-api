import {
  IsString,
  IsOptional,
  IsIn,
  IsBooleanString,
  IsNumberString,
} from 'class-validator';

export default class ObtainOffereesDTO {
  @IsString()
  fullname: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  requestsMade: 'ASC' | 'DESC';

  @IsOptional()
  @IsBooleanString()
  prohibited: boolean;

  @IsNumberString()
  take: number;
}
