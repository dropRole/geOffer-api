import {
  IsOptional,
  IsUUID,
  IsBooleanString,
  IsIn,
  IsNotEmpty,
  IsNumberString,
} from 'class-validator';

export default class ObtainProhibitionsDTO {
  @IsOptional()
  @IsUUID()
  idOfferee: string;

  @IsOptional()
  @IsUUID()
  idOfferor: string;

  @IsBooleanString()
  terminated: boolean = false;

  @IsIn(['ASC', 'DESC'])
  prohibitedOrder: 'ASC' | 'DESC' = 'DESC';

  @IsNotEmpty()
  @IsNumberString()
  take: number;
}
