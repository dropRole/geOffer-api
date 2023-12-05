import { IsIn, IsNotEmpty, IsNumberString } from 'class-validator';

export default class ObtainRequestsDTO {
  @IsIn(['ASC', 'DESC'])
  requestedOrder: 'ASC' | 'DESC' = 'DESC';

  @IsNotEmpty()
  @IsNumberString()
  take: number;
}
