import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  Param,
  StreamableFile,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  FileTypeValidator,
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
import { createReadStream } from 'fs';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PublicRoute } from 'src/auth/public-route.decorator';

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
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
      }),
    )
    files: { highlight: Express.Multer.File; gallery: Express.Multer.File[] },
  ): Promise<{ id: string }> {
    return;
  }

  @Get()
  @PrivilegedRoute('SUPERUSER', 'OFFEREE')
  obtainOfferors(
    @Query() obtainOfferorsDTO: ObtainOfferorsDTO,
  ): Promise<Offeror[]> {
    return;
  }

  @Get('/:id/image')
  obtainOfferorImage(
    @Param()
    @Query('destination')
    destination: string,
  ): StreamableFile {
    const file = createReadStream(destination);

    return new StreamableFile(file);
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
      | 'offers'
      | 'reputation'
      | 'user'
      | 'requests'
      | 'images'
    >
  > {
    return;
  }

  @Get('/reputation')
  @PrivilegedRoute('OFFEROR')
  claimReputation(@ExtractUser() user: User): Promise<OfferorReputation> {
    return;
  }

  @Patch('/offer')
  @PrivilegedRoute('OFFEROR')
  alterOffering(
    @ExtractUser() user: User,
    @Body('offer') offer: string,
  ): Promise<void> {
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
}
