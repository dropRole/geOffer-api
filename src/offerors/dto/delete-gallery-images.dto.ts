import { IsJSON } from 'class-validator';

export class DeleteGalleryImagesDTO {
  @IsJSON()
  imageIds: string;
}
