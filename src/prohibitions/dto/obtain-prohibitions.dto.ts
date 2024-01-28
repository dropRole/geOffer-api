import {
  IsOptional,
  IsUUID,
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

  @IsIn(['ASC', 'DESC'])
  prohibitedOrder: 'ASC' | 'DESC' = 'DESC';

  @IsNotEmpty()
  @IsNumberString()
  take: number;
}
