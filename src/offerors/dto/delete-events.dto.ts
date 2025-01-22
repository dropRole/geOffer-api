import { IsJSON } from 'class-validator';

export class DeleteEventsDTO {
  @IsJSON()
  eventIds: string;
}
