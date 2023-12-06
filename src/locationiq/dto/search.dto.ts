import { IsString, IsNotEmpty } from 'class-validator';

export default class SearchDTO {
  @IsString()
  @IsNotEmpty()
  query: string;
}
