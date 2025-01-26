import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import BaseService from '../base.service';
import { Offeror } from './entities/offeror.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  SelectQueryBuilder,
  QueryRunner,
  Repository,
} from 'typeorm';
import RecordOfferorDTO from './dto/record-offeror.dto';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/entities/user.entity';
import * as bcrypt from 'bcrypt';
import ObtainOfferorsDTO from './dto/obtain-offerors.dto';
import { OfferorCategory, OfferorReputation } from './entities/offeror.entity';
import AmendBusinessInfoDTO from './dto/amend-business-info.dto';
import AlterReputationDTO from './dto/alter-reputation.dto';
import Reservation from '../reservations/entities/reservation.entity';
import { ReservationsService } from '../reservations/reservations.service';
import Image from './entities/image.entity';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { DeleteGalleryImagesDTO } from './dto/delete-gallery-images.dto';
import * as path from 'path';
import { ProvideServiceDTO } from './dto/provide-service.dto';
import { Service } from './entities/service.entity';
import type { ServiceCategory } from './entities/service.entity';
import Event from './entities/event.entity';
import ServiceToOfferor from './entities/service-to-offeror.entity';
import { AddEventDTO } from './dto/add-event.dto';
import { AlterServiceInfoDTO } from './dto/alter-service-info.dto';
import { DeleteServicesDTO } from './dto/delete-services-products.dto';
import { RequestsService } from '../requests/requests.service';
import { DeleteEventsDTO } from './dto/delete-events.dto';
import * as moment from 'moment';

@Injectable()
export class OfferorsService extends BaseService<Offeror> {
  private S3Client: S3Client;

  constructor(
    private dataSource: DataSource,
    @InjectRepository(Offeror)
    offerorsRepo: Repository<Offeror>,
    @InjectRepository(Service)
    private servicesRepo: Repository<Service>,
    @InjectRepository(ServiceToOfferor)
    private offerorServicesRepo: Repository<ServiceToOfferor>,
    @InjectRepository(Image)
    private imagesRepo: Repository<Image>,
    @InjectRepository(Event)
    private eventsRepo: Repository<Event>,
    private authService: AuthService,
    @Inject(forwardRef(() => RequestsService))
    private requestsService: RequestsService,
    @Inject(forwardRef(() => ReservationsService))
    private reservationsService: ReservationsService,
  ) {
    super(offerorsRepo);

    this.S3Client = new S3Client({
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
      },
      region: 'eu-north-1',
    });
  }

  async recordOfferor(
    recordOfferorDTO: RecordOfferorDTO,
    images: { highlight: Express.Multer.File; gallery: Express.Multer.File[] },
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
        category,
        address,
        coordinates,
        telephone,
        email,
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
        category: category as OfferorCategory,
        address: JSON.parse(address),
        coordinates: JSON.parse(coordinates),
        telephone,
        email,
        businessHours: JSON.parse(businessHours),
        user,
        images: [],
      });

      const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

      try {
        await queryRunner.connect();
        await queryRunner.startTransaction();

        await queryRunner.manager.insert(User, user);
        await queryRunner.manager.insert(Offeror, offeror);

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();

        throw new InternalServerErrorException(
          `Error during the user and offeror insertion transaction: ${error.message}.`,
        );
      } finally {
        await queryRunner.release();
      }

      this.dataLoggerService.create(user.constructor.name, user.username);
      this.dataLoggerService.create(offeror.constructor.name, offeror.id);

      let uploadResults = '';

      for (const image of [images.highlight[0], ...(images.gallery ?? [])]) {
        const isImageMimeType = image.mimetype.match(/image/g);

        if (!isImageMimeType) {
          uploadResults += ` The ${image.fieldname} image ${image.originalname} isn't of image mimetype.`;

          continue;
        }

        const todaysDate = moment(new Date());

        const putCommand = new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `${image.fieldname}/${todaysDate.format('HHmmss')}_${
            image.originalname
          }`,
          Body: image.buffer,
          ACL: 'public-read',
          ContentType: image.mimetype,
        });

        try {
          await this.S3Client.send(putCommand);
        } catch (error) {
          uploadResults += ` The ${image.fieldname} image ${image.originalname} failed to upload: ${error.message}.`;

          continue;
        }
        uploadResults += ` The ${image.fieldname} image ${image.originalname} successfully uploaded.`;

        const offerorImage: Image = this.imagesRepo.create({
          offeror,
          type: image.fieldname.toUpperCase(),
          destination: `${process.env.AWS_S3_BUCKET_URL}/${
            image.fieldname
          }/${todaysDate.format('HHmmss')}_${image.originalname}`,
        });

        try {
          await this.imagesRepo.insert(offerorImage);
        } catch (error) {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `${image.fieldname}/${todaysDate.format('HHmmss')}_${
              image.originalname
            }`,
          });

          await this.S3Client.send(deleteCommand);
        }

        this.dataLoggerService.create(
          offerorImage.constructor.name,
          offerorImage.id,
        );
      }

      return {
        id: offeror.id,
        uploadResults: uploadResults.trim(),
      };
    }

    throw new ConflictException(`Username ${username} is already in use.`);
  }

  async provideService(
    user: User,
    provideServiceDTO: ProvideServiceDTO,
  ): Promise<void> {
    const offeror: Offeror = await this.obtainOneBy({
      user: { username: user.username },
    });

    const { category, detailed, price, idEvent } = provideServiceDTO;

    let service: Service;

    try {
      service = await this.servicesRepo.findOneBy({
        category: category as ServiceCategory,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during fetching the service with the category ${category}: ${error.message}.`,
      );
    }

    let event: Event;

    if (idEvent)
      try {
        event = await this.eventsRepo.findOneBy({ id: idEvent });
      } catch (error) {
        throw new InternalServerErrorException(
          `Error during fetching the event identified with ${idEvent}: ${error.message}.`,
        );
      }

    const serviceToOfferor: ServiceToOfferor = this.offerorServicesRepo.create({
      price,
      offeror,
      service,
      event,
      serviceRequests: [],
    });

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    if (!service) {
      service = this.servicesRepo.create({
        category: category as ServiceCategory,
        detailed,
        offerors: [],
      });

      try {
        await queryRunner.connect();
        await queryRunner.startTransaction();

        const serviceInsertResult = await queryRunner.manager.insert(
          Service,
          service,
        );

        await queryRunner.manager.insert(ServiceToOfferor, {
          ...serviceToOfferor,
          service: { ...service, id: serviceInsertResult.identifiers[0].id },
        });

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();

        throw new InternalServerErrorException(
          `Error during service insertion: ${error.message}.`,
        );
      } finally {
        await queryRunner.release();
      }

      this.dataLoggerService.create(service.constructor.name, service.id);
      this.dataLoggerService.create(
        ServiceToOfferor.constructor.name,
        serviceToOfferor.id,
      );

      return;
    }

    try {
      await this.offerorServicesRepo.insert(serviceToOfferor);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the offeror's service insertion: ${error.message}.`,
      );
    }

    this.dataLoggerService.create(
      ServiceToOfferor.constructor.name,
      serviceToOfferor.id,
    );

    return;
  }

  async addGalleryImages(
    user: User,
    images: Express.Multer.File[],
  ): Promise<{ uploadResults: string }> {
    const offeror = await this.obtainOneBy({
      user: { username: user.username },
    });

    let uploadResults = '';

    for (const galleryImage of images) {
      const isImageMimeType = galleryImage.mimetype.match(/image/g);

      if (!isImageMimeType) {
        uploadResults += ` The gallery image ${galleryImage.originalname} isn't of image mimetype.`;

        continue;
      }

      const todaysDate = moment(new Date());

      const putCommand = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `${galleryImage.fieldname}/${todaysDate.format('HHmmss')}_${
          galleryImage.originalname
        }`,
        Body: galleryImage.buffer,
        ACL: 'public-read',
        ContentType: galleryImage.mimetype,
      });

      try {
        await this.S3Client.send(putCommand);
      } catch (error) {
        uploadResults += ` The gallery image ${galleryImage.originalname} failed to upload: ${error.message}.`;

        continue;
      }
      uploadResults += ` The gallery image ${galleryImage.originalname} successfully uploaded.`;

      const offerorGalleryImage: Image = this.imagesRepo.create({
        offeror,
        type: 'GALLERY',
        destination: `${
          process.env.AWS_S3_BUCKET_URL
        }/gallery/${todaysDate.format('HHmmss')}_${galleryImage.originalname}`,
      });

      try {
        await this.imagesRepo.insert(offerorGalleryImage);
      } catch (error) {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `gallery/${todaysDate.format('HHmmss')}_${
            galleryImage.originalname
          }`,
        });

        await this.S3Client.send(deleteCommand);

        continue;
      }

      this.dataLoggerService.create(
        offerorGalleryImage.constructor.name,
        offerorGalleryImage.id,
      );
    }

    return {
      uploadResults: uploadResults.trim(),
    };
  }

  async addEvent(
    user: User,
    image: Express.Multer.File,
    addEventDTO: AddEventDTO,
  ): Promise<{ id: string; uploadResult: string }> {
    const offeror: Offeror = await this.obtainOneBy({
      user: { username: user.username },
    });

    const { name, detailed, beginning, conclusion } = addEventDTO;

    const event: Event = this.eventsRepo.create({
      name,
      detailed,
      beginning,
      conclusion,
      images: [],
      services: [],
    });

    try {
      await this.eventsRepo.insert(event);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the event insertion: ${error.message}`,
      );
    }

    this.dataLoggerService.create(event.constructor.name, event.id);

    const todaysDate = moment(new Date());

    const putCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `highlight/${todaysDate.format('HHmmss')}_${image.originalname}`,
      Body: image.buffer,
      ACL: 'public-read',
      ContentType: image.mimetype,
    });

    try {
      await this.S3Client.send(putCommand);
    } catch (error) {
      return { id: event.id, uploadResult: error.message };
    }

    const eventImage: Image = this.imagesRepo.create({
      destination: `${
        process.env.AWS_S3_BUCKET_URL
      }/highlight/${todaysDate.format('HHmmss')}_${image.originalname}`,
      type: 'HIGHLIGHT',
      offeror,
      event,
    });

    try {
      await this.imagesRepo.insert(eventImage);
    } catch (error) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `highlight/${todaysDate.format('HHmmss')}_${image.originalname}`,
      });

      await this.S3Client.send(deleteCommand);

      return {
        id: event.id,
        uploadResult: `Error during the event image insertion: ${error.message}.`,
      };
    }

    this.dataLoggerService.create(eventImage.constructor.name, eventImage.id);

    return {
      id: event.id,
      uploadResult: `The event image ${image.originalname} successfully uploaded.`,
    };
  }

  async obtainOfferors(obtainOfferorsDTO: ObtainOfferorsDTO): Promise<{
    offerors: (Offeror & { reservationsMade?: number })[];
    count: number;
  }> {
    type ObtainedOfferor = Offeror & {
      reservationsMade?: number;
    };

    const { name, city, reservationsMade, take } = obtainOfferorsDTO;

    const queryBuilder: SelectQueryBuilder<Offeror> =
      this.repo.createQueryBuilder('offeror');
    queryBuilder.where('UPPER(name) LIKE UPPER(:name)', {
      name: `%${name}%`,
    });

    if (city)
      queryBuilder.where("UPPER(address->'city'->>'name') LIKE UPPER(:city)", {
        city,
      });

    queryBuilder.take(take);

    let offerors: ObtainedOfferor[];

    let records: [ObtainedOfferor[], number];

    try {
      records = await queryBuilder.getManyAndCount();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during fetching the offerors: ${error.message}.`,
      );
    }

    offerors = records[0];

    if (reservationsMade) {
      offerors = await Promise.all(
        offerors.map(async (offeror): Promise<ObtainedOfferor> => {
          const reservations: Reservation[] =
            await this.reservationsService.obtainManyBy({
              request: {
                services: { serviceToOfferor: { offeror: { id: offeror.id } } },
              },
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

    return { offerors, count: records[1] };
  }

  async obtainOfferorService(
    idOfferorService: string,
  ): Promise<ServiceToOfferor> {
    let offerorService: ServiceToOfferor;

    try {
      offerorService = await this.offerorServicesRepo.findOneBy({
        id: idOfferorService,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during fetching the offeror's service: ${error.message}.`,
      );
    }

    return offerorService;
  }

  async claimBusinessInfo(
    user: User,
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
    const { name, address, coordinates, telephone, email, businessHours } =
      await this.obtainOneBy({
        user: { username: user.username },
      });

    return {
      name,
      address,
      coordinates,
      telephone,
      email,
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

    const { name, address, coordinates, telephone, email, businessHours } =
      amendBusinessInfoDTO;

    try {
      await this.repo.update(
        { user: { username: user.username } },
        {
          name,
          address: JSON.parse(address),
          coordinates: JSON.parse(coordinates),
          telephone,
          email,
          businessHours: JSON.parse(businessHours),
        },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the business info update: ${error.message}.`,
      );
    }

    this.dataLoggerService.update(
      offeror.constructor.name,
      offeror.id,
      `{ name: ${offeror.name}, address: ${JSON.stringify(
        offeror.address,
      )}, coordinates: ${offeror.coordinates}, 
      telephone: ${offeror.telephone}, email: ${offeror.email}, 
      businessHours: ${
        offeror.businessHours
      } } => { name: ${name}, address: ${JSON.stringify(
        offeror.address,
      )}, telephone: ${telephone}, email: ${email}, coordinates: ${coordinates} , businessHours: ${businessHours} }`,
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
        `Error during the reputation update: ${error.message}.`,
      );
    }

    this.dataLoggerService.update(
      offeror.constructor.name,
      offeror.id,
      `{ reputation: { ${offeror.reputation.responsiveness}, ${offeror.reputation.compliance}, ${offeror.reputation.timeliness} } } => { reputation: { ${responsiveness}, ${compliance}, ${timeliness} } }`,
    );

    return { id };
  }

  async alterServiceInfo(
    user: User,
    idService: string,
    alterServiceDTO: AlterServiceInfoDTO,
  ): Promise<void> {
    const { detailed, price } = alterServiceDTO;

    const service: Service = await this.servicesRepo.findOneBy({
      id: idService,
    });

    try {
      await this.servicesRepo.update({ id: idService }, { detailed });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the service details update: ${error.message}.`,
      );
    }

    this.dataLoggerService.update(
      service.constructor.name,
      service.id,
      `{ detailed: ${service.detailed} => detailed: ${detailed} }`,
    );

    const offeror: Offeror = await this.obtainOneBy({
      user: { username: user.username },
    });

    const offerorService: ServiceToOfferor =
      await this.offerorServicesRepo.findOneBy({ service, offeror });

    try {
      await this.offerorServicesRepo.update({ offeror }, { price });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the service price update: ${error.message}.`,
      );
    }

    this.dataLoggerService.update(
      offerorService.constructor.name,
      offerorService.id,
      `{ price: ${offerorService.price} => price: ${offerorService.price} }`,
    );
  }

  async changeHighlightImage(
    user: User,
    image: Express.Multer.File,
  ): Promise<{ changeResult: string }> {
    const offeror: Offeror = await this.obtainOneBy({
      user: { username: user.username },
    });

    let highlightImage: Image;

    try {
      highlightImage = await this.imagesRepo.findOneBy({
        offeror: { id: offeror.id },
        type: 'HIGHLIGHT',
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during fetching the event highlight image data: ${error.message}.`,
      );
    }

    let changeResult = '';

    if (highlightImage) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `highlight/${path.basename(highlightImage.destination)}`,
      });

      try {
        await this.S3Client.send(deleteCommand);
      } catch (error) {
        changeResult = error.message;

        return { changeResult };
      }
    }

    const isImageMimeType = image.mimetype.match(/image/g);

    if (!isImageMimeType)
      return {
        changeResult: `The highlight image ${image.originalname} isn't of the image mimetype.`,
      };

    const todaysDate = moment(new Date());

    const putCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `highlight/${todaysDate.format('HHmmss')}_${image.originalname}`,
      Body: image.buffer,
      ACL: 'public-read',
      ContentType: image.mimetype,
    });

    try {
      await this.S3Client.send(putCommand);
    } catch (error) {
      changeResult = `The highlight image ${image.originalname} failed to upload: ${error.message}.`;

      return { changeResult };
    }

    changeResult = `The highlight image ${image.originalname} uploaded successfully.`;

    const offerorImage: Image = await this.imagesRepo.findOneBy({
      offeror: { user: { username: user.username } },
    });

    try {
      await this.imagesRepo.update(
        { id: highlightImage.id },
        {
          destination: `${
            process.env.AWS_S3_BUCKET_URL
          }/highlight/${todaysDate.format('HHmmss')}_${image.originalname}`,
        },
      );
    } catch (error) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `highlight/${todaysDate.format('HHmmss')}_${image.originalname}`,
      });

      await this.S3Client.send(deleteCommand);

      throw new InternalServerErrorException(
        `Error during the highlight image data update: ${error.message}.`,
      );
    }

    this.dataLoggerService.update(
      offerorImage.constructor.name,
      offerorImage.id,
      `{ destination: ${offerorImage.destination} => destination: ${
        process.env.AWS_S3_BUCKET_URL
      }/highlight/${todaysDate.format('HHmmss')}_${image.originalname} }`,
    );

    return { changeResult: changeResult.trim() };
  }

  async amendEventInfo(
    idEvent: string,
    amendEventInfoDTO: AddEventDTO,
  ): Promise<void> {
    const { name, detailed, beginning, conclusion } = amendEventInfoDTO;

    const event: Event = await this.eventsRepo.findOneBy({ id: idEvent });

    try {
      await this.eventsRepo.update(
        { id: idEvent },
        { name, detailed, beginning, conclusion },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the event update: ${error.message}.`,
      );
    }

    this.dataLoggerService.update(
      event.constructor.name,
      event.id,
      `{ name: ${event.name},
        detailed: ${event.detailed},
        beginning: ${event.beginning},
        conclusion: ${event.conclusion} => 
        name: ${name},
        detailed: ${detailed},
        beginning: ${beginning},
        conclusion: ${conclusion} }`,
    );
  }

  async changeEventImage(
    idEvent: string,
    image: Express.Multer.File,
  ): Promise<{ changeResult: string }> {
    let changeResult = '';

    let eventImage: Image;

    try {
      eventImage = await this.imagesRepo.findOneBy({ event: { id: idEvent } });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during fetching the event image: ${error.message}.`,
      );
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `highlight/${path.basename(eventImage.destination)}`,
    });

    try {
      await this.S3Client.send(deleteCommand);
    } catch (error) {
      changeResult = `Previous event image failed to delete: ${error.message}.`;

      return { changeResult };
    }

    const todaysDate = moment(new Date());

    const putCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `highlight/${todaysDate.format('HHmmss')}_${image.originalname}`,
      Body: image.buffer,
      ACL: 'public-read',
      ContentType: image.mimetype,
    });

    try {
      await this.S3Client.send(putCommand);
    } catch (error) {
      changeResult = `New event image failed to upload: ${error.message}.`;

      await this.imagesRepo.delete({ id: eventImage.id });

      return { changeResult };
    }

    try {
      await this.imagesRepo.update(
        { id: eventImage.id },
        {
          destination: `${
            process.env.AWS_S3_BUCKET_URL
          }/highlight/${todaysDate.format('HHmmss')}_${image.originalname}`,
        },
      );
    } catch (error) {
      changeResult = `Event image destination failed to update: ${error.message}.`;

      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `highlight/${todaysDate.format('HHmmss')}_${image.originalname}`,
      });

      await this.S3Client.send(deleteCommand);

      return { changeResult };
    }

    this.dataLoggerService.update(
      eventImage.constructor.name,
      eventImage.id,
      `{ destination: ${
        eventImage.destination
      } => destination: highlight/${todaysDate.format('HHmmss')}_${
        image.originalname
      } }`,
    );

    return {
      changeResult: `The event image ${image.originalname} was successfully uploaded.`,
    };
  }

  async deleteGalleryImages(
    deleteGalleryImagesDTO: DeleteGalleryImagesDTO,
  ): Promise<{ deleteResults: string }> {
    const { imageIds } = deleteGalleryImagesDTO;

    const ids = JSON.parse(imageIds).ids;

    let deleteResults = '';

    for (const id of ids) {
      const galleryImage: Image = await this.imagesRepo.findOne({
        where: { id },
      });

      let objectDeleted = true;

      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `gallery/${path.basename(galleryImage.destination)}`,
      });

      try {
        await this.S3Client.send(deleteCommand);
      } catch (error) {
        objectDeleted = false;

        deleteResults += ` Error during AWS object deletion: ${error.message}.`;
      }

      if (objectDeleted) {
        try {
          await this.imagesRepo.delete({ id });
        } catch (error) {
          deleteResults += ` Error during gallery image ${path.basename(
            galleryImage.destination,
          )} deletion: ${error.message}. `;
        }

        deleteResults += ` The gallery image ${path.basename(
          galleryImage.destination,
        )} successfully deleted.`;

        this.dataLoggerService.delete(
          galleryImage.constructor.name,
          galleryImage.id,
        );
      }
    }

    return { deleteResults: deleteResults.trim() };
  }

  async deleteServices(
    user: User,
    deleteServicesDTO: DeleteServicesDTO,
  ): Promise<{ affectedRecords: number }> {
    const { serviceIds } = deleteServicesDTO;

    const ids: string[] = JSON.parse(serviceIds).ids;

    let affectedRecords = 0;

    const offerorService = await this.offerorServicesRepo.findOneBy({
      offeror: { user: { username: user.username } },
    });

    for (const id of ids) {
      try {
        await this.requestsService.revokeRequestsForService(offerorService.id);

        await this.offerorServicesRepo.delete({ service: { id } });

        await this.servicesRepo.delete({ id });
      } catch (error) {
        affectedRecords++;

        continue;
      }

      this.dataLoggerService.delete('Service', id);

      affectedRecords++;
    }

    return { affectedRecords };
  }

  async deleteEvents(
    deleteEventsDTO: DeleteEventsDTO,
  ): Promise<{ deleteResults: string }> {
    const { eventIds } = deleteEventsDTO;

    const ids: string[] = JSON.parse(eventIds).ids;

    let deleteResults = '';

    for (const id of ids) {
      let event: Event;

      try {
        event = await this.eventsRepo.findOneBy({ id });
      } catch (error) {
        deleteResults += `Error during fetching the event with the id ${id}: ${error.message}.`;

        continue;
      }

      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `highlight/${path.basename(event.images[0].destination)}`,
      });

      let objectImageDeleted = true;

      try {
        await this.S3Client.send(deleteCommand);
      } catch (error) {
        objectImageDeleted = false;

        deleteResults += ` The image object of the "${event.name}" failed to delete: ${error.message}.`;
      }

      if (objectImageDeleted)
        deleteResults += ` The image object of the "${event.name}" successfully deleted.`;

      try {
        await this.imagesRepo.delete({ event: { id } });

        await this.offerorServicesRepo.delete({ event: { id } });

        await this.eventsRepo.delete({ id });
      } catch (error) {
        deleteResults += ` The event "${event.name}" failed to delete: ${error.message}.`;

        continue;
      }

      deleteResults += ` The event "${event.name}" was deleted.`;
    }

    return { deleteResults };
  }
}
