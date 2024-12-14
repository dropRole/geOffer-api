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
} from '@nestjs/common';
import { OfferorsService } from './offerors.service';
import { PrivilegedRoute } from '../auth/privileged-route.decorator';
import RecordOfferorDTO from './dto/record-offeror.dto';
import Offeror from './offeror.entity';
import ObtainOfferorsDTO from './dto/obtain-offerors.dto';
import ExtractUser from 'src/auth/extract-user.decorator';
import { OfferorReputation } from './types';
import AmendBusinessInfoDTO from './dto/amend-business-info.dto';
import AlterReputationDTO from './dto/alter-reputation.dto';
import User from 'src/auth/user.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { DeleteGalleryImagesDTO } from './dto/delete-gallery-images.dto';

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
    files: { highlight: Express.Multer.File; gallery: Express.Multer.File[] },
  ): Promise<{ id: string; uploadResults: string }> {
    return this.offerorsService.recordOfferor(recordOfferorDTO, files);
  }

  @Post('/images/gallery')
  @PrivilegedRoute('OFFEROR')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'gallery', maxCount: 10 }]))
  addGalleryImages(
    @ExtractUser() user: User,
    @UploadedFiles()
    files: {
      gallery: Express.Multer.File[];
    },
  ): Promise<{ uploadResults: string }> {
    return this.offerorsService.addGalleryImages(user, files);
  }

  @Get()
  @PrivilegedRoute('SUPERUSER', 'OFFEREE')
  obtainOfferors(
    @Query() obtainOfferorsDTO: ObtainOfferorsDTO,
  ): Promise<Record<any, any>[]> {
    return this.offerorsService.obtainOfferors(obtainOfferorsDTO);
  }

  @Get('/business-info')
  @PrivilegedRoute('OFFEROR')
  claimBusinessInfo(
    @ExtractUser() user: User,
  ): Promise<
    Omit<
      Offeror,
      | 'id'
      | 'coordinates'
      | 'reputation'
      | 'user'
      | 'requests'
      | 'images'
      | 'events'
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

  @Patch('/images/highlight')
  @PrivilegedRoute('OFFEROR')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'highlight', maxCount: 1 }]))
  changeHighlightImage(
    @ExtractUser() user: User,
    @UploadedFiles()
    files: {
      highlight: Express.Multer.File;
    },
  ): Promise<{ changeResult: string }> {
    return this.offerorsService.changeHighlightImage(user, files);
  }

  @Delete('/images/gallery')
  @PrivilegedRoute('OFFEROR')
  deleteGalleryImages(
    @ExtractUser() user: User,
    @Body() deleteGalleryImagesDTO: DeleteGalleryImagesDTO,
  ): Promise<{ deleteResults: string }> {
    return this.offerorsService.deleteGalleryImages(
      user,
      deleteGalleryImagesDTO,
    );
  }
}
