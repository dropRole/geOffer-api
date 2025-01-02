import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  Param,
  UseInterceptors,
  UploadedFiles,
  Delete,
  ParseFilePipe,
  FileTypeValidator,
  UploadedFile,
} from '@nestjs/common';
import { OfferorsService } from './offerors.service';
import { PrivilegedRoute } from 'src/auth/privileged-route.decorator';
import RecordOfferorDTO from './dto/record-offeror.dto';
import Offeror from './offeror.entity';
import ObtainOfferorsDTO from './dto/obtain-offerors.dto';
import ExtractUser from 'src/auth/extract-user.decorator';
import { OfferorReputation } from './types';
import AmendBusinessInfoDTO from './dto/amend-business-info.dto';
import AlterReputationDTO from './dto/alter-reputation.dto';
import User from 'src/auth/user.entity';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { DeleteGalleryImagesDTO } from './dto/delete-gallery-images.dto';
import { AddEventDTO } from './dto/add-event.dto';
import { DeleteEventsDTO } from './dto/delete-events.dto';
import { ProvideServiceDTO } from './dto/provide-service.dto';
import { AlterServiceInfoDTO } from './dto/alter-service-info.dto';
import { DeleteServicesDTO } from './dto/delete-services-products.dto';
import { AmendEventInfoDTO } from './dto/amend-event.info.dto';

@Controller('offerors')
export class OfferorsController {
  constructor(private offerorsService: OfferorsService) {}

  @Post()
  @PrivilegedRoute('SUPERUSER')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'highlight', maxCount: 1 },
      { name: 'gallery', maxCount: 10 },
    ]),
  )
  recordOfferor(
    @Body() recordOfferorDTO: RecordOfferorDTO,
    @UploadedFiles()
    images: { highlight: Express.Multer.File; gallery: Express.Multer.File[] },
  ): Promise<{ id: string; uploadResults: string }> {
    return;
  }

  @Post('/services')
  @PrivilegedRoute('OFFEROR')
  provideService(
    @ExtractUser() user: User,
    @Body() provideServiceDTO: ProvideServiceDTO,
  ): Promise<void> {
    return;
  }

  @Post('/images/gallery')
  @PrivilegedRoute('OFFEROR')
  @UseInterceptors(FilesInterceptor('gallery', 10))
  addGalleryImages(
    @ExtractUser() user: User,
    @UploadedFiles()
    images: Express.Multer.File[],
  ): Promise<{ uploadResults: string }> {
    return;
  }

  @Post('/events')
  @PrivilegedRoute('OFFEROR')
  @UseInterceptors(FileInterceptor('image'))
  addEvent(
    @ExtractUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
      }),
    )
    image: Express.Multer.File,
    @Body() addEventDTO: AddEventDTO,
  ): Promise<{ id: string; uploadResult: string }> {
    return;
  }

  @Get()
  @PrivilegedRoute('SUPERUSER', 'OFFEREE')
  obtainOfferors(@Query() obtainOfferorsDTO: ObtainOfferorsDTO): Promise<{
    records: (Offeror & { reservationsMade?: number })[];
    count: number;
  }> {
    return;
  }

  @Get('/business-info')
  @PrivilegedRoute('OFFEROR')
  claimBusinessInfo(
    @ExtractUser() user: User,
  ): Promise<
    Pick<
      Offeror,
      | 'name'
      | 'address'
      | 'coordinates'
      | 'telephone'
      | 'email'
      | 'businessHours'
    >
  > {
    return;
  }

  @Get('/reputation')
  @PrivilegedRoute('OFFEROR')
  claimReputation(@ExtractUser() user: User): Promise<OfferorReputation> {
    return;
  }

  @Patch('/business-info')
  @PrivilegedRoute('OFFEROR')
  amendBusinessInfo(
    @ExtractUser() user: User,
    @Body() amendBusinessInfoDTO: AmendBusinessInfoDTO,
  ): Promise<void> {
    return;
  }

  @Patch('/:id/reputation')
  @PrivilegedRoute('SUPERUSER')
  alterReputation(
    @Param('id') id: string,
    @Body() alterReputationDTO: AlterReputationDTO,
  ): Promise<{ id: string }> {
    return;
  }

  @Patch('/services/:idService/info')
  @PrivilegedRoute('OFFEROR')
  alterServiceInfo(
    @ExtractUser() user: User,
    @Param('idService') idService: string,
    @Body()
    alterServiceInfoDTO: AlterServiceInfoDTO,
  ): Promise<void> {
    return;
  }

  @Patch('/images/highlight')
  @PrivilegedRoute('OFFEROR')
  @UseInterceptors(FileInterceptor('image'))
  changeHighlightImage(
    @ExtractUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
      }),
    )
    image: Express.Multer.File,
  ): Promise<{ changeResult: string }> {
    return;
  }

  @Patch('/events/:idEvent/info')
  @PrivilegedRoute('OFFEROR')
  amendEventInfo(
    @Param('idEvent') idEvent: string,
    @Body() amendEventInfoDTO: AmendEventInfoDTO,
  ): Promise<void> {
    return;
  }

  @Patch('/events/:idEvent/image')
  @PrivilegedRoute('OFFEROR')
  @UseInterceptors(FileInterceptor('image'))
  changeEventImage(
    @Param('idEvent') idEvent: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
      }),
    )
    image: Express.Multer.File,
  ): Promise<{ changeResult: string }> {
    return;
  }

  @Delete('/images/gallery')
  @PrivilegedRoute('OFFEROR')
  deleteGalleryImages(
    @Body() deleteGalleryImagesDTO: DeleteGalleryImagesDTO,
  ): Promise<{ deleteResults: string }> {
    return;
  }

  @Delete('/services')
  @PrivilegedRoute('OFFEROR')
  deleteServices(
    @ExtractUser() user: User,
    @Body() deleteServicesDTO: DeleteServicesDTO,
  ): Promise<{ affectedRecords: string }> {
    return;
  }

  @Delete('/events')
  @PrivilegedRoute('OFFEROR')
  deleteEvents(
    @Body() deleteEventsDTO: DeleteEventsDTO,
  ): Promise<{ deleteResults: string }> {
    return;
  }
}
