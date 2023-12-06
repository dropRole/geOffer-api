import { IsString, IsNotEmpty } from 'class-validator';

export default class RewriteComplaintDTO {
  @IsString()
  @IsNotEmpty()
  content: string;
}
