import {
  IsOptional,
  IsUUID,
  IsIn,
  IsNotEmpty,
  IsNumberString,
} from 'class-validator';

export default class ObtainReservationsDTO {
  @IsOptional()
  @IsUUID()
  idOfferee: string;

  @IsOptional()
  @IsUUID()
  idOfferor: string;

  @IsIn(['ASC', 'DESC'])
  reservedOrder: 'ASC' | 'DESC' = 'ASC';

  @IsNotEmpty()
  @IsNumberString()
  take: number;
}
