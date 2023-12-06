import { IsIn, IsNotEmpty, IsNumberString } from 'class-validator';

export default class ObtainComplaintsDTO {
  @IsIn(['ASC', 'DESC'])
  writtenOrder: 'ASC' | 'DESC' = 'DESC';

  @IsNotEmpty()
  @IsNumberString()
  take: number;
}
