import { IsString, IsNotEmpty } from 'class-validator';

export default class RenameIncidentDTO {
  @IsString()
  @IsNotEmpty()
  title: string;
}
