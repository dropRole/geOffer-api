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
} from '@nestjs/platform-express';
import { DeleteGalleryImagesDTO } from './dto/delete-gallery-images.dto';
import { AddEventDTO } from './dto/add-event.dto';
import { DeleteEventsDTO } from './dto/delete-events.dto';
import { ProvideServiceDTO } from './dto/provide-service.dto';
import { AlterServiceInfoDTO } from './dto/alter-service-info.dto';
import { DeleteServicesDTO } from './dto/delete-services-products.dto';
import { AmendEventInfoDTO } from './dto/amend-event-info.dto';

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
    return this.offerorsService.recordOfferor(recordOfferorDTO, images);
  }

  @Post('/services')
  @PrivilegedRoute('OFFEROR')
  provideService(
    @ExtractUser() user: User,
    @Body() provideServiceDTO: ProvideServiceDTO,
  ): Promise<void> {
    return this.offerorsService.provideService(user, provideServiceDTO);
  }

  @Post('/images/gallery')
  @PrivilegedRoute('OFFEROR')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'gallery', maxCount: 10 }]))
  addGalleryImages(
    @ExtractUser() user: User,
    @UploadedFiles()
    images: {
      gallery: Express.Multer.File[];
    },
  ): Promise<{ uploadResults: string }> {
    return this.offerorsService.addGalleryImages(user, images);
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
  ): Promise<{ id: string; uploadResults: string }> {
    return this.offerorsService.addEvent(user, image, addEventDTO);
  }

  @Get()
  @PrivilegedRoute('SUPERUSER', 'OFFEREE')
  obtainOfferors(@Query() obtainOfferorsDTO: ObtainOfferorsDTO): Promise<{
    offerors: (Offeror & { reservationsMade?: number })[];
    count: number;
  }> {
    return this.offerorsService.obtainOfferors(obtainOfferorsDTO);
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
    return this.offerorsService.claimBusinessInfo(user);
  }

  @Get('/reputation')
  @PrivilegedRoute('OFFEROR')
  claimReputation(@ExtractUser() user: User): Promise<OfferorReputation> {
    return this.offerorsService.claimReputation(user);
  }

  @Patch('/business-info')
  @PrivilegedRoute('OFFEROR')
  amendBusinessInfo(
    @ExtractUser() user: User,
    @Body() amendBusinessInfoDTO: AmendBusinessInfoDTO,
  ): Promise<void> {
    return this.offerorsService.amendBusinessInfo(user, amendBusinessInfoDTO);
  }

  @Patch('/:id/reputation')
  @PrivilegedRoute('SUPERUSER')
  alterReputation(
    @Param('id') id: string,
    @Body() alterReputationDTO: AlterReputationDTO,
  ): Promise<{ id: string }> {
    return this.offerorsService.alterReputation(id, alterReputationDTO);
  }

  @Patch('/services/:idService/info')
  @PrivilegedRoute('OFFEROR')
  alterServiceInfo(
    @ExtractUser() user: User,
    @Param('idService') idService: string,
    @Body()
    alterServiceInfoDTO: AlterServiceInfoDTO,
  ): Promise<void> {
    return this.offerorsService.alterServiceInfo(
      user,
      idService,
      alterServiceInfoDTO,
    );
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
    return this.offerorsService.changeHighlightImage(user, image);
  }

  @Patch('/events/:idEvent/info')
  @PrivilegedRoute('OFFEROR')
  amendEventInfo(
    @Param('idEvent') idEvent: string,
    @Body() amendEventInfoDTO: AmendEventInfoDTO,
  ): Promise<void> {
    return this.offerorsService.amendEventInfo(idEvent, amendEventInfoDTO);
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
    return this.offerorsService.changeEventImage(idEvent, image);
  }

  @Delete('/images/gallery')
  @PrivilegedRoute('OFFEROR')
  deleteGalleryImages(
    @Body() deleteGalleryImagesDTO: DeleteGalleryImagesDTO,
  ): Promise<{ deleteResults: string }> {
    return this.offerorsService.deleteGalleryImages(deleteGalleryImagesDTO);
  }

  @Delete('/services')
  @PrivilegedRoute('OFFEROR')
  deleteServices(
    @ExtractUser() user: User,
    @Body() deleteServicesDTO: DeleteServicesDTO,
  ): Promise<{ affectedRecords: number }> {
    return this.offerorsService.deleteServices(user, deleteServicesDTO);
  }

  @Delete('/events')
  @PrivilegedRoute('OFFEROR')
  deleteEvents(
    @Body() deleteEventsDTO: DeleteEventsDTO,
  ): Promise<{ deleteResults: string }> {
    return this.offerorsService.deleteEvents(deleteEventsDTO);
  }
}
