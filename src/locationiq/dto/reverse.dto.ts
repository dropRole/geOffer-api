import { IsLatLong } from 'class-validator';

export default class ReverseDTO {
  @IsLatLong()
  latLong: string;
}
