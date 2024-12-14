import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import BaseService from '../base.service';
import Offeror from './offeror.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  SelectQueryBuilder,
  QueryRunner,
  Repository,
} from 'typeorm';
import RecordOfferorDTO from './dto/record-offeror.dto';
import { AuthService } from '../auth/auth.service';
import User from '../auth/user.entity';
import * as bcrypt from 'bcrypt';
import ObtainOfferorsDTO from './dto/obtain-offerors.dto';
import { OfferorReputation } from './types';
import AmendBusinessInfoDTO from './dto/amend-business-info.dto';
import AlterReputationDTO from './dto/alter-reputation.dto';
import Reservation from 'src/reservations/reservation.entity';
import { ReservationsService } from 'src/reservations/reservations.service';
import OfferorImage from './offeror-images.entity';
import * as aws from 'aws-sdk';
import { DeleteGalleryImagesDTO } from './dto/delete-gallery-images.dto';
import * as path from 'path';

@Injectable()
export class OfferorsService extends BaseService<Offeror> {
  constructor(
    @InjectRepository(Offeror)
    offerorsRepo: Repository<Offeror>,
    @InjectRepository(OfferorImage)
    private offerorImagesRepo: Repository<OfferorImage>,
    private authService: AuthService,
    private dataSource: DataSource,
    @Inject(forwardRef(() => ReservationsService))
    private reservationsService: ReservationsService,
  ) {
    super(offerorsRepo);
  }

  async recordOfferor(
    recordOfferorDTO: RecordOfferorDTO,
    files: { highlight: Express.Multer.File; gallery: Express.Multer.File[] },
  ): Promise<{ id: string; uploadResults: string }> {
    const { username } = recordOfferorDTO;

    let user: User;

    try {
      user = await this.authService.obtainOneBy({
        username,
      });
    } catch (error) {
      const {
        name,
        address,
        coordinates,
        telephone,
        email,
        service,
        businessHours,
        password,
      } = recordOfferorDTO;

      const hash: string = await bcrypt.hash(password, 9);

      user = this.dataSource.manager.create(User, {
        username,
        password: hash,
        privilege: 'OFFEROR',
      });

      const offeror: Offeror = this.repo.create({
        name,
        address: JSON.parse(address),
        coordinates: JSON.parse(coordinates),
        telephone,
        email,
        service: JSON.parse(service),
        businessHours: JSON.parse(businessHours),
        user,
        requests: [],
        images: [],
        events: [],
      });

      const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await queryRunner.manager.insert(User, user);
        await queryRunner.manager.insert(Offeror, offeror);

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();

        throw new InternalServerErrorException(
          `Error during the user and offeror insertion transaction: ${error.message}`,
        );
      }

      const s3 = new aws.S3({
        accessKeyId: process.env.AWS_S3_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
      });

      let uploadResults = `The highlight image ${files.highlight[0].originalname} isn't of the image/* mimetype.`;

      if (files.highlight[0].mimetype.match(/image/g)) {
        const offerorHighlightImage: OfferorImage =
          this.offerorImagesRepo.create({
            offeror,
            type: 'HIGHLIGHT',
            destination: `${process.env.AWS_S3_BUCKET_URL}/highlight/${files.highlight[0].originalname}`,
          });

        try {
          await this.offerorImagesRepo.insert(offerorHighlightImage);

          await s3
            .upload({
              Bucket: process.env.AWS_S3_BUCKET,
              Key: `highlight/${files.highlight[0].originalname}`,
              Body: files.highlight[0].buffer,
              ACL: 'public-read',
              ContentType: files.highlight[0].mimetype,
            })
            .promise();

          uploadResults += `The file ${files.highlight[0].originalname} uploaded successfully.`;
        } catch (error) {
          uploadResults = `The file ${files.highlight[0].originalname} failed to upload: ${error.message}`;
        }
      }

      for (const galleryImage of files.gallery) {
        let galleryImageUploadResult = `The gallery image ${galleryImage.originalname} isn't of image/* mimetype.`;

        if (galleryImage.mimetype.match(/image/g)) {
          const offerorGalleryImage: OfferorImage =
            this.offerorImagesRepo.create({
              offeror,
              type: 'GALLERY',
              destination: `${process.env.AWS_S3_BUCKET_URL}/gallery/${galleryImage.originalname}`,
            });

          try {
            await this.offerorImagesRepo.insert(offerorGalleryImage);

            await s3
              .upload({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: `gallery/${galleryImage.originalname}`,
                Body: galleryImage.buffer,
                ACL: 'public-read',
                ContentType: galleryImage.mimetype,
              })
              .promise();

            galleryImageUploadResult = ` The gallery image ${galleryImage.originalname} successfully uploaded.`;
          } catch (error) {
            uploadResults += error.message;
          }

          uploadResults += galleryImageUploadResult;
        }
      }

      this.dataLoggerService.create(user.constructor.name, user.username);
      this.dataLoggerService.create(offeror.constructor.name, offeror.id);

      return {
        id: offeror.id,
        uploadResults: `${uploadResults}`.trim(),
      };
    }

    throw new ConflictException(`Username ${username} is already in use.`);
  }

  async addGalleryImages(
    user: User,
    files: { gallery: Express.Multer.File[] },
  ): Promise<{ uploadResults: string }> {
    const offeror = await this.obtainOneBy({
      user: { username: user.username },
    });

    const s3 = new aws.S3({
      accessKeyId: process.env.AWS_S3_ACCESS_KEY,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    });

    let uploadResults = '';

    for (const galleryImage of files.gallery) {
      let galleryImageUploadResult = `The gallery image ${galleryImage.originalname} isn't of image/* mimetype.`;

      if (galleryImage.mimetype.match(/image/g)) {
        const offerorGalleryImage: OfferorImage = this.offerorImagesRepo.create(
          {
            offeror,
            type: 'GALLERY',
            destination: `${process.env.AWS_S3_BUCKET_URL}/gallery/${galleryImage.originalname}`,
          },
        );

        try {
          await this.offerorImagesRepo.insert(offerorGalleryImage);

          await s3
            .upload({
              Bucket: process.env.AWS_S3_BUCKET,
              Key: `gallery/${galleryImage.originalname}`,
              Body: galleryImage.buffer,
              ACL: 'public-read',
              ContentType: galleryImage.mimetype,
            })
            .promise();

          galleryImageUploadResult = ` The gallery image ${galleryImage.originalname} successfully uploaded.`;
        } catch (error) {
          uploadResults += error.message;
        }

        uploadResults += galleryImageUploadResult;
      }
    }

    return {
      uploadResults: `${uploadResults}`.trim(),
    };
  }

  async obtainOfferors(
    obtainOfferorsDTO: ObtainOfferorsDTO,
  ): Promise<Record<any, any>[]> {
    interface ObtainedOfferor extends Offeror {
      count: number;
      reservationsMade: number;
    }
    const { name, city, reservationsMade, take } = obtainOfferorsDTO;

    const queryBuilder: SelectQueryBuilder<Offeror> =
      this.repo.createQueryBuilder('offeror');
    queryBuilder.addSelect('COUNT(id) AS count');
    queryBuilder.groupBy('id');
    queryBuilder.where('UPPER(name) LIKE UPPER(:name)', {
      name: `%${name}%`,
    });

    if (city)
      queryBuilder.where("UPPER(address->'city'->>'name') LIKE UPPER(:city)", {
        city,
      });

    queryBuilder.take(take);

    let offerors: ObtainedOfferor[];

    try {
      offerors = await queryBuilder.execute();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during fetching the offerors: ${error.message}`,
      );
    }

    if (reservationsMade) {
      offerors = await Promise.all(
        offerors.map(async (offeror): Promise<ObtainedOfferor> => {
          const reservations: Reservation[] =
            await this.reservationsService.obtainManyBy({
              request: { offeror: { id: offeror.id } },
            });

          offeror.reservationsMade = reservations.length;

          return offeror;
        }),
      );

      if (reservationsMade === 'ASC')
        offerors.sort((a: ObtainedOfferor, b: ObtainedOfferor) =>
          a.reservationsMade > b.reservationsMade ? -1 : 1,
        );
      else
        offerors.sort((a: ObtainedOfferor, b: ObtainedOfferor) =>
          a.reservationsMade > b.reservationsMade ? 1 : -1,
        );
    }

    return offerors;
  }

  async claimBusinessInfo(
    user: User,
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
    const { name, address, telephone, email, service, businessHours } =
      await this.obtainOneBy({
        user: { username: user.username },
      });

    return {
      name,
      address,
      telephone,
      email,
      service,
      businessHours,
    };
  }

  async claimReputation(user: User): Promise<OfferorReputation> {
    const { reputation } = await this.obtainOneBy({
      user: { username: user.username },
    });

    return {
      responsiveness: reputation.responsiveness,
      compliance: reputation.compliance,
      timeliness: reputation.timeliness,
    };
  }

  async amendBusinessInfo(
    user: User,
    amendBusinessInfoDTO: AmendBusinessInfoDTO,
  ): Promise<void> {
    const offeror: Offeror = await this.obtainOneBy({
      user: { username: user.username },
    });

    const { name, address, telephone, email, service, businessHours } =
      amendBusinessInfoDTO;

    try {
      await this.repo.update(
        { user: { username: user.username } },
        {
          name,
          address: JSON.parse(address),
          telephone,
          email,
          service: JSON.parse(service),
          businessHours: JSON.parse(businessHours),
        },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the business info update: ${error.message}`,
      );
    }

    this.dataLoggerService.update(
      offeror.constructor.name,
      offeror.id,
      `{ name: ${offeror.name}, address: ${JSON.stringify(
        offeror.address,
      )}, telephone: ${offeror.telephone}, email: ${offeror.email}, service: ${
        offeror.service
      }, businessHours: ${
        offeror.businessHours
      } } => { name: ${name}, address: ${JSON.stringify(
        offeror.address,
      )}, telephone: ${telephone}, email: ${email}, service: ${service} , businessHours: ${businessHours} }`,
    );
  }

  async alterReputation(
    id: string,
    alterReputationDTO: AlterReputationDTO,
  ): Promise<{ id: string }> {
    const offeror: Offeror = await this.obtainOneBy({ id });

    const { responsiveness, compliance, timeliness } = alterReputationDTO;

    try {
      await this.repo.update(
        { id },
        { reputation: { responsiveness, compliance, timeliness } },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the reputation update: ${error.message}`,
      );
    }

    this.dataLoggerService.update(
      offeror.constructor.name,
      offeror.id,
      `{ reputation: { ${offeror.reputation.responsiveness}, ${offeror.reputation.compliance}, ${offeror.reputation.timeliness} } } => { reputation: { ${responsiveness}, ${compliance}, ${timeliness} } }`,
    );

    return { id };
  }

  async changeHighlightImage(
    user: User,
    files: {
      highlight: Express.Multer.File;
    },
  ): Promise<{ changeResult: string }> {
    const offeror: Offeror = await this.obtainOneBy({
      user: { username: user.username },
    });

    const s3 = new aws.S3({
      accessKeyId: process.env.AWS_S3_ACCESS_KEY,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    });

    let highlightImage: OfferorImage;

    try {
      highlightImage = await this.offerorImagesRepo.findOne({
        where: { offeror: { id: offeror.id }, type: 'HIGHLIGHT' },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during fetching the highlight image data: ${error.message}`,
      );
    }

    let changeResult = '';

    if (highlightImage)
      try {
        await s3
          .deleteObject({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `highlight/${path.basename(highlightImage.destination)}`,
          })
          .promise();
      } catch (error) {
        changeResult = error.message;

        return { changeResult };
      }

    let uploadResults = `The highlight image ${files.highlight[0].originalname} isn't of the image/* mimetype.`;

    if (files.highlight[0].mimetype.match(/image/g)) {
      try {
        await s3
          .upload({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `highlight/${files.highlight[0].originalname}`,
            Body: files.highlight[0].buffer,
            ACL: 'public-read',
            ContentType: files.highlight[0].mimetype,
          })
          .promise();

        uploadResults = `The file ${files.highlight[0].originalname} uploaded successfully.`;
      } catch (error) {
        changeResult = `The file ${files.highlight[0].originalname} failed to upload: ${error.message}`;

        return { changeResult };
      }
    }

    if (highlightImage && changeResult === '') {
      changeResult = uploadResults;

      try {
        await this.offerorImagesRepo.update(
          { id: highlightImage.id },
          {
            destination: `${process.env.AWS_S3_BUCKET_URL}/highlight/${files.highlight[0].originalname}`,
          },
        );
      } catch (error) {
        throw new InternalServerErrorException(
          `Error during the highlight image data update: ${error.message}`,
        );
      }
    }

    return { changeResult: changeResult.trim() };
  }

  async deleteGalleryImages(
    user: User,
    deleteGalleryImagesDTO: DeleteGalleryImagesDTO,
  ): Promise<{ deleteResults: string }> {
    const { imageIds } = deleteGalleryImagesDTO;

    const ids = JSON.parse(imageIds).ids;

    const s3 = new aws.S3({
      accessKeyId: process.env.AWS_S3_ACCESS_KEY,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    });

    let deleteResults = '';

    for (const id of ids) {
      const galleryImage: OfferorImage = await this.offerorImagesRepo.findOne({
        where: { id },
      });

      let objectDeleted = false;

      try {
        await s3
          .deleteObject({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `gallery/${path.basename(galleryImage.destination)}`,
          })
          .promise();

        objectDeleted = true;
      } catch (error) {
        deleteResults += `Error during AWS object deletion: ${error.message}`;
      }

      if (objectDeleted) {
        try {
          await this.offerorImagesRepo.delete({ id });

          deleteResults += `The gallery image ${path.basename(
            galleryImage.destination,
          )} is successfully deleted.`;
        } catch (error) {
          deleteResults += `Error during OfferorImage deletion: ${error.message}. `;
        }
      }
    }

    return { deleteResults: deleteResults.trim() };
  }
}
