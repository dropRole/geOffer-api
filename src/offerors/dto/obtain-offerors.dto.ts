import {
  IsString,
  IsOptional,
  IsIn,
  IsNotEmpty,
  IsNumberString,
} from 'class-validator';

export default class ObtainOfferorsDTO {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  city: string;

  @IsIn(['ASC', 'DESC'])
  reservationsMade: 'ASC' | 'DESC';

  @IsNotEmpty()
  @IsNumberString()
  take: number;
}
