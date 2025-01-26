import { Test, TestingModule } from '@nestjs/testing';
import { OfferorsController } from './offerors.controller';
import { OfferorsService } from './offerors.service';
import RecordOfferorDTO from './dto/record-offeror.dto';
import {
  Offeror,
  OfferorCategory,
  OfferorReputation,
} from './entities/offeror.entity';
import {
  mockOfferorsRepo,
  mockReservationsRepo,
  mockUsersRepo,
  mockImagesRepo,
  mockEventsRepo,
  mockServicesRepo,
  mockOfferorServicesRepo,
} from '../testing-mocks';
import { ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../auth/entities/user.entity';
import * as bcrypt from 'bcrypt';
import ObtainOfferorsDTO from './dto/obtain-offerors.dto';
import AmendBusinessInfoDTO from './dto/amend-business-info.dto';
import AlterReputationDTO from './dto/alter-reputation.dto';
import Image from './entities/image.entity';
import { DeleteGalleryImagesDTO } from './dto/delete-gallery-images.dto';
import { ProvideServiceDTO } from './dto/provide-service.dto';
import { Service, ServiceCategory } from './entities/service.entity';
import Event from './entities/event.entity';
import ServiceToOfferor from './entities/service-to-offeror.entity';
import { AddEventDTO } from './dto/add-event.dto';
import { AlterServiceInfoDTO } from './dto/alter-service-info.dto';
import { AmendEventInfoDTO } from './dto/amend-event.info.dto';
import { DeleteServicesDTO } from './dto/delete-services-products.dto';
import { DeleteEventsDTO } from './dto/delete-events.dto';

let usersRepo: User[] = mockUsersRepo;
let offerorsRepo: Offeror[] = mockOfferorsRepo;
let servicesRepo: Service[] = mockServicesRepo;
let offerorServicesRepo: ServiceToOfferor[] = mockOfferorServicesRepo;
let eventsRepo: Event[] = mockEventsRepo;
let imagesRepo: Image[] = mockImagesRepo;

describe('OfferorsController', () => {
  let controller: OfferorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OfferorsController],
    })
      .useMocker((token) => {
        if (token === OfferorsService)
          return {
            recordOfferor: jest.fn().mockImplementation(
              (
                recordOfferorDTO: RecordOfferorDTO,
                files: {
                  highlight: Express.Multer.File;
                  gallery: Express.Multer.File[];
                },
              ): { id: string } => {
                const { username } = recordOfferorDTO;

                const inUse: User | undefined = usersRepo.find(
                  (user) => user.username === username,
                );

                if (inUse)
                  throw new ConflictException(
                    `Username ${username} is already in use.`,
                  );

                const {
                  password,
                  name,
                  category,
                  address,
                  coordinates,
                  email,
                  telephone,
                  businessHours,
                } = recordOfferorDTO;

                const user: User = {
                  username,
                  password: bcrypt.hashSync(password, 9),
                  privilege: 'OFFEROR',
                  created: new Date().toString(),
                  incidents: [],
                  complaints: [],
                };

                usersRepo.push(user);

                const offeror: Offeror = {
                  id: uuidv4(),
                  name,
                  category: category as OfferorCategory,
                  address: JSON.parse(address),
                  coordinates: JSON.parse(coordinates),
                  telephone,
                  email,
                  businessHours: JSON.parse(businessHours),
                  reputation: {
                    responsiveness: 10,
                    compliance: 10,
                    timeliness: 10,
                  },
                  user,
                  services: [],
                  images: [],
                };

                const highlightImage: Image = {
                  id: uuidv4(),
                  type: 'HIGHLIGHT',
                  destination: files.highlight.destination,
                  offeror,
                  event: undefined,
                };

                imagesRepo.push(highlightImage);

                offeror.images.push(highlightImage);

                for (const galleryImage of files.gallery) {
                  const image: Image = {
                    id: uuidv4(),
                    type: 'GALLERY',
                    destination: galleryImage.destination,
                    offeror,
                    event: undefined,
                  };

                  imagesRepo.push(image);

                  offeror.images.push(image);
                }

                offerorsRepo.push(offeror);

                return { id: offeror.id };
              },
            ),
            provideService: jest
              .fn()
              .mockImplementation(
                (user: User, provideServiceDTO: ProvideServiceDTO): void => {
                  const offeror: Offeror = mockOfferorsRepo.find(
                    (offeror) => offeror.user.username === user.username,
                  );

                  const { category, detailed, price, idEvent } =
                    provideServiceDTO;

                  let event: Event;

                  if (idEvent)
                    event = eventsRepo.find((event) => event.id === idEvent);

                  const service: Service = {
                    id: uuidv4(),
                    category: category as ServiceCategory,
                    detailed,
                    offerors: [],
                  };

                  const offerorService: ServiceToOfferor = {
                    id: uuidv4(),
                    price,
                    service,
                    offeror,
                    event,
                    serviceRequests: [],
                  };

                  service.offerors = [offerorService];

                  servicesRepo.push(service);

                  offerorServicesRepo.push(offerorService);
                },
              ),
            addGalleryImages: jest
              .fn()
              .mockImplementation(
                (user: User, images: Express.Multer.File[]): void => {
                  offerorsRepo = offerorsRepo.map((offeror) => {
                    if (offeror.user.username === user.username) {
                      for (const galleryImage of images) {
                        const image: Image = {
                          id: uuidv4(),
                          type: 'GALLERY',
                          destination: galleryImage.destination,
                          offeror,
                          event: undefined,
                        };

                        imagesRepo.push(image);

                        offeror.images.push(image);
                      }
                    }

                    return offeror;
                  });
                },
              ),
            addEvent: jest
              .fn()
              .mockImplementation(
                (
                  user: User,
                  image: Express.Multer.File,
                  addEventDTO: AddEventDTO,
                ): { id: string } => {
                  const { name, beginning, conclusion, detailed } = addEventDTO;

                  const event: Event = {
                    id: uuidv4(),
                    name,
                    beginning,
                    conclusion,
                    detailed,
                    images: [],
                    services: [],
                  };

                  const eventImage: Image = {
                    id: uuidv4(),
                    type: 'HIGHLIGHT',
                    destination: image.destination,
                    offeror: undefined,
                    event,
                  };

                  event.images = [eventImage];

                  eventsRepo.push(event);

                  imagesRepo.push(eventImage);

                  return { id: event.id };
                },
              ),
            obtainOfferors: jest
              .fn()
              .mockImplementation(
                (obtainOfferorsDTO: ObtainOfferorsDTO): Offeror[] => {
                  type ObtainedOfferor = Offeror & { reservationsMade: number };

                  const { name, city, reservationsMade, take } =
                    obtainOfferorsDTO;

                  let offerors: Offeror[];

                  const upperName: string = name.toUpperCase();
                  if (name)
                    offerors = offerorsRepo.filter((offeror) =>
                      offeror.name.toUpperCase().match(`/${upperName}/g`),
                    );

                  const upperCity: string = name.toUpperCase();

                  if (city)
                    offerors = (name ? offerors : offerorsRepo).filter(
                      (offeror) =>
                        offeror.address.city.name
                          .toUpperCase()
                          .match(`/${upperCity}/g`),
                    );

                  let obtainedOfferors: ObtainedOfferor[];

                  obtainedOfferors = offerors.map(
                    (offeror: ObtainedOfferor) => {
                      let reservationsMade = 0;

                      mockReservationsRepo.forEach((reservation) => {
                        reservation.request.services.forEach((service) => {
                          if (
                            service.serviceToOfferor.offeror.id === offeror.id
                          )
                            reservationsMade++;
                        });
                      });

                      return { ...offeror, reservationsMade };
                    },
                  );

                  if (reservationsMade === 'ASC')
                    obtainedOfferors.sort((a, b) =>
                      a.reservationsMade > b.reservationsMade ? 1 : -1,
                    );

                  if (reservationsMade === 'DESC')
                    obtainedOfferors.sort((a, b) =>
                      a.reservationsMade > b.reservationsMade ? -1 : 1,
                    );

                  return obtainedOfferors.slice(0, take);
                },
              ),
            claimBusinessInfo: jest
              .fn()
              .mockImplementation(
                (
                  user: User,
                ): Pick<
                  Offeror,
                  | 'name'
                  | 'address'
                  | 'coordinates'
                  | 'telephone'
                  | 'email'
                  | 'businessHours'
                > => {
                  const offeror: Offeror = offerorsRepo.find(
                    (offeror) => offeror.user.username === user.username,
                  );

                  const {
                    name,
                    coordinates,
                    address,
                    telephone,
                    email,
                    businessHours,
                  } = offeror;

                  return {
                    name,
                    address,
                    coordinates,
                    telephone,
                    email,
                    businessHours,
                  };
                },
              ),
            claimReputation: jest
              .fn()
              .mockImplementation((user: User): OfferorReputation => {
                const offeror: Offeror = offerorsRepo.find(
                  (offeror) => offeror.user.username === user.username,
                );

                const { reputation } = offeror;

                return reputation;
              }),
            amendBusinessInfo: jest
              .fn()
              .mockImplementation(
                (
                  user: User,
                  amendBusinessInfoDTO: AmendBusinessInfoDTO,
                ): void => {
                  offerorsRepo = offerorsRepo.map((offeror) => {
                    if (offeror.user.username === user.username) {
                      return {
                        ...offeror,
                        name: amendBusinessInfoDTO.name,
                        address: JSON.parse(amendBusinessInfoDTO.address),
                        coordinates: JSON.parse(
                          amendBusinessInfoDTO.coordinates,
                        ),
                        telephone: amendBusinessInfoDTO.telephone,
                        email: amendBusinessInfoDTO.email,
                        businessHours: JSON.parse(
                          amendBusinessInfoDTO.businessHours,
                        ),
                      };
                    }

                    return offeror;
                  });
                },
              ),
            alterReputation: jest
              .fn()
              .mockImplementation(
                (
                  id: string,
                  alterReputationDTO: AlterReputationDTO,
                ): { id: string } => {
                  offerorsRepo = offerorsRepo.map((offeror) => {
                    if (offeror.id === id) {
                      id = offeror.id;

                      return {
                        ...offeror,
                        address: JSON.stringify(offeror.address),
                        reputation: { ...alterReputationDTO },
                      };
                    }

                    return {
                      ...offeror,
                      address: JSON.parse(JSON.stringify(offeror.address)),
                    };
                  });

                  return { id };
                },
              ),
            alterServiceInfo: jest
              .fn()
              .mockImplementation(
                (
                  user: User,
                  idService: string,
                  alterServiceInfoDTO: AlterServiceInfoDTO,
                ): void => {
                  const { detailed, price } = alterServiceInfoDTO;

                  servicesRepo = servicesRepo.map((service) => {
                    if (service.id === idService) service.detailed = detailed;

                    return service;
                  });

                  offerorServicesRepo = offerorServicesRepo.map(
                    (offerorService) => {
                      if (
                        offerorService.service.id === idService &&
                        offerorService.offeror.user.username === user.username
                      )
                        offerorService.price = price;

                      return offerorService;
                    },
                  );
                },
              ),
            changeHighlightImage: jest
              .fn()
              .mockImplementation(
                (user: User, image: Express.Multer.File): void => {
                  offerorsRepo = offerorsRepo.map((offeror) => {
                    if (offeror.user.username === user.username) {
                      offeror.images.map((image) => {
                        if (image.type === 'HIGHLIGHT') {
                          image.destination = image.destination;

                          return image;
                        }

                        return image;
                      });
                    }

                    return offeror;
                  });

                  imagesRepo = imagesRepo.map((image) => {
                    if (
                      image.offeror &&
                      image.offeror.user.username === user.username &&
                      image.type === 'HIGHLIGHT'
                    ) {
                      image.destination = image.destination;
                    }

                    return image;
                  });
                },
              ),
            amendEventInfo: jest
              .fn()
              .mockImplementation(
                (
                  idEvent: string,
                  amendEventInfoDTO: AmendEventInfoDTO,
                ): void => {
                  eventsRepo = eventsRepo.map((event) => {
                    if (event.id === idEvent)
                      event = { ...event, ...amendEventInfoDTO };

                    return event;
                  });
                },
              ),
            changeEventImage: jest
              .fn()
              .mockImplementation(
                (idEvent: string, eventImage: Express.Multer.File): void => {
                  imagesRepo = imagesRepo.map((image) => {
                    if (image.event && image.event.id === idEvent)
                      image = { ...image, destination: eventImage.destination };

                    return image;
                  });
                },
              ),
            deleteGalleryImages: jest
              .fn()
              .mockImplementation(
                (deleteGalleryImagesDTO: DeleteGalleryImagesDTO): void => {
                  const { imageIds } = deleteGalleryImagesDTO;

                  const ids: string[] = JSON.parse(imageIds).ids;

                  offerorsRepo = offerorsRepo.filter((offeror) =>
                    offeror.images.filter(
                      (image) => !ids.find((id) => id === image.id),
                    ),
                  );

                  imagesRepo = imagesRepo.filter(
                    (image) => !ids.find((id) => id === image.id),
                  );
                },
              ),
            deleteServices: jest
              .fn()
              .mockImplementation(
                (
                  user: User,
                  deleteServicesDTO: DeleteServicesDTO,
                ): { affectedRecords: number } => {
                  const { serviceIds } = deleteServicesDTO;

                  const ids: string[] = JSON.parse(serviceIds).ids;

                  let i = 0;

                  offerorServicesRepo = offerorServicesRepo.filter(
                    (offerorService) =>
                      !ids.includes(offerorService.service.id),
                  );

                  servicesRepo = servicesRepo.filter((service) =>
                    service.offerors.forEach((serviceOfferor) => {
                      if (
                        serviceOfferor.offeror.user.username ===
                          user.username &&
                        ids.includes(service.id)
                      ) {
                        i++;

                        return false;
                      }
                    }),
                  );

                  return { affectedRecords: i };
                },
              ),
            deleteEvents: jest
              .fn()
              .mockImplementation(
                (
                  deleteEventsDTO: DeleteEventsDTO,
                ): { affectedRecords: number } => {
                  const { eventIds } = deleteEventsDTO;

                  const ids: string[] = JSON.parse(eventIds).ids;

                  let i = 0;

                  imagesRepo = imagesRepo.filter(
                    (image) => !ids.includes(image.event ? image.event.id : ''),
                  );

                  eventsRepo = eventsRepo.filter((event) => {
                    if (ids.includes(event.id)) {
                      i++;

                      return false;
                    }
                  });

                  return { affectedRecords: i };
                },
              ),
          };
      })
      .compile();

    controller = module.get<OfferorsController>(OfferorsController);
  });

  describe('recordOfferor', () => {
    const recordOfferorDTO: RecordOfferorDTO = {
      username: 'cafeenigma',
      password: 'cafeEnigma@24',
      name: 'Cafe Enigma',
      category: 'Café/Pub',
      address: JSON.stringify({
        street: { name: 'Cara Lazara', numeration: '7' },
        city: { name: 'Čačak', postalCode: '32000' },
        country: 'Serbia',
      }),
      coordinates: JSON.stringify({ latitude: 0, longitude: 0 }),
      telephone: '032 343878',
      email: 'cafeenigma@email.com',
      businessHours: JSON.stringify({
        Monday: { from: '08:00', to: '00:00' },
        Tuesday: { from: '08:00', to: '00:00' },
        Wednesday: { from: '08:00', to: '00:00' },
        Thursday: { from: '08:00', to: '00:00' },
        Friday: { from: '08:00', to: '00:00' },
        Saturday: { from: '08:00', to: '01:00' },
        Sunday: { from: '08:00', to: '01:00' },
      }),
    };

    const files: {
      highlight: Express.Multer.File;
      gallery: Express.Multer.File[];
    } = {
      highlight: {
        buffer: Buffer.alloc(1000000),
        destination: undefined,
        fieldname: 'highlight',
        filename: 'enigma_highlight_image.webp',
        mimetype: 'image/webp',
        originalname: 'enigma_highlight_image.webp',
        path: undefined,
        size: 1000000,
        stream: undefined,
        encoding: 'UTF-8',
      },
      gallery: [
        {
          buffer: Buffer.alloc(1000000),
          destination: undefined,
          fieldname: 'gallery',
          filename: 'enigma_gallery_image.webp',
          mimetype: 'image/webp',
          originalname: 'enigma_gallery_image.webp',
          path: undefined,
          size: 1000000,
          stream: undefined,
          encoding: 'UTF-8',
        },
        {
          buffer: Buffer.alloc(1000000),
          destination: undefined,
          fieldname: 'gallery',
          filename: 'enigma_gallery_image_0.webp',
          mimetype: 'image/webp',
          originalname: 'enigma_gallery_image_0.webp',
          path: undefined,
          size: 1000000,
          stream: undefined,
          encoding: 'UTF-8',
        },
      ],
    };

    it('should return an object that holds an id property', () => {
      expect(controller.recordOfferor(recordOfferorDTO, files)).toMatchObject<{
        id: string;
      }>({
        id: expect.any(String),
      });
    });

    it('should throw a ConflictException', () => {
      recordOfferorDTO.username = 'johndoe';
      expect(() => controller.recordOfferor(recordOfferorDTO, files)).toThrow(
        `Username ${recordOfferorDTO.username} is already in use.`,
      );
    });
  });

  describe('provideService', () => {
    it('should be void', () => {
      const provideServiceDTO: ProvideServiceDTO = {
        category: 'Seat reservation',
        detailed: 'Price may vary in the future',
        price: 10,
        idEvent: undefined,
      };

      expect(
        controller.provideService(offerorsRepo[2].user, provideServiceDTO),
      ).toBeUndefined();
    });
  });

  describe('addGalleryImages', () => {
    it('should be void', () => {
      const images: Express.Multer.File[] = [
        {
          buffer: Buffer.alloc(1000000),
          destination: undefined,
          fieldname: 'gallery',
          filename: 'enigma_gallery_image_1.webp',
          mimetype: 'image/webp',
          originalname: 'enigma_gallery_image.webp',
          path: undefined,
          size: 1000000,
          stream: undefined,
          encoding: 'UTF-8',
        },
        {
          buffer: Buffer.alloc(1000000),
          destination: undefined,
          fieldname: 'gallery',
          filename: 'enigma_gallery_image_2.webp',
          mimetype: 'image/webp',
          originalname: 'enigma_gallery_image_0.webp',
          path: undefined,
          size: 1000000,
          stream: undefined,
          encoding: 'UTF-8',
        },
      ];

      expect(
        controller.addGalleryImages(
          offerorsRepo[offerorsRepo.length - 1].user,
          images,
        ),
      ).toBeUndefined();
    });
  });

  describe('addEvent', () => {
    it('should return an object holding an id of an inserted event', () => {
      const addEventDTO: AddEventDTO = {
        name: 'Party',
        beginning: '30.01.2025 21:00:00',
        conclusion: '30.01.2025 21:00:00',
        detailed: 'Bring your palls',
      };

      const eventImage: Express.Multer.File = {
        buffer: Buffer.alloc(1000000),
        destination: 'somewhere_on_aws_bucket',
        fieldname: 'highlight',
        filename: 'enigma_event_highlight_image.webp',
        mimetype: 'image/webp',
        originalname: 'enigma_event_highlight_image.webp',
        path: undefined,
        size: 1000000,
        stream: undefined,
        encoding: 'UTF-8',
      };

      expect(
        controller.addEvent(offerorsRepo[2].user, eventImage, addEventDTO),
      ).toMatchObject({ id: expect.any(String) });
    });
  });

  describe('obtainOfferors', () => {
    it('should return an instance of Offeror array', () => {
      const obtainOfferorsDTO: ObtainOfferorsDTO = {
        name: 'Los Pollos Hermanos',
        city: 'Albaquerque',
        reservationsMade: 'ASC',
        take: 10,
      };

      expect(controller.obtainOfferors(obtainOfferorsDTO)).toBeInstanceOf(
        Array<Offeror>,
      );
    });
  });

  describe('claimBusinessInfo', () => {
    it('should return an object that holds name, address, telephone, email, service and businessHours properties', () => {
      expect(controller.claimBusinessInfo(usersRepo[5])).toMatchObject<
        Pick<
          Offeror,
          | 'name'
          | 'address'
          | 'coordinates'
          | 'telephone'
          | 'email'
          | 'businessHours'
        >
      >({
        name: expect.any(String),
        address: expect.any(Object),
        coordinates: expect.any(Object),
        telephone: expect.any(String),
        email: expect.any(String),
        businessHours: expect.any(Object),
      });
    });
  });

  describe('claimReputation', () => {
    it('should return an object that holds responsiveness, compliance, timeliness properties', () => {
      expect(controller.claimReputation(offerorsRepo[2].user)).toMatchObject({
        responsiveness: expect.any(Number),
        compliance: expect.any(Number),
        timeliness: expect.any(Number),
      });
    });
  });

  describe('amendBusinessInfo', () => {
    it('should be void', () => {
      expect(
        controller.amendBusinessInfo(usersRepo[5], {
          name: offerorsRepo[1].name,
          address: JSON.stringify(offerorsRepo[1].address),
          coordinates: JSON.stringify(offerorsRepo[1].coordinates),
          telephone: offerorsRepo[1].telephone,
          email: offerorsRepo[1].email,
          businessHours: JSON.stringify(offerorsRepo[1].businessHours),
        }),
      ).toBeUndefined();
    });
  });

  describe('alterReputation', () => {
    it('should return an object that holds id property', () => {
      expect(
        controller.alterReputation(offerorsRepo[1].id, {
          responsiveness: 9,
          compliance: 9,
          timeliness: 9,
        }),
      ).toMatchObject<{ id: string }>({
        id: expect.any(String),
      });
    });
  });

  describe('alterServiceInfo', () => {
    it('should be void', () => {
      const alterServiceInfoDTO: AlterServiceInfoDTO = {
        detailed: 'Per seat reservation',
        price: 15,
      };

      expect(
        controller.alterServiceInfo(
          offerorsRepo[2].user,
          servicesRepo[servicesRepo.length - 1].id,
          alterServiceInfoDTO,
        ),
      ).toBeUndefined();
    });
  });

  describe('changeHighlightImage', () => {
    it('should be void', () => {
      const image: Express.Multer.File = {
        buffer: Buffer.alloc(1000000),
        destination: undefined,
        fieldname: 'highlight',
        filename: 'enigma_highlight_image_0.webp',
        mimetype: 'image/webp',
        originalname: 'enigma_gallery_image_0.webp',
        path: undefined,
        size: 1000000,
        stream: undefined,
        encoding: 'UTF-8',
      };

      expect(
        controller.changeHighlightImage(
          offerorsRepo[offerorsRepo.length - 1].user,
          image,
        ),
      ).toBeUndefined();
    });
  });

  describe('amendEventInfo', () => {
    it('should be void', () => {
      const amendEventInfoDTO: AmendEventInfoDTO = {
        name: 'Party of the night',
        beginning: '30.01.2025 21:00:00',
        conclusion: '30.01.2025 21:00:00',
        detailed: 'Bring your palls',
      };

      expect(
        controller.amendEventInfo(eventsRepo[1].id, amendEventInfoDTO),
      ).toBeUndefined();
    });
  });

  describe('changeEventImage', () => {
    it('should be void', () => {
      const eventImage: Express.Multer.File = {
        buffer: Buffer.alloc(1000000),
        destination: 'somewhere_on_aws_bucket',
        fieldname: 'highlight',
        filename: 'enigma_event_highlight_image_1.webp',
        mimetype: 'image/webp',
        originalname: 'enigma_event_highlight_image_1.webp',
        path: undefined,
        size: 1000000,
        stream: undefined,
        encoding: 'UTF-8',
      };

      expect(
        controller.changeEventImage(eventsRepo[1].id, eventImage),
      ).toBeUndefined();
    });
  });

  describe('deleteGalleryImages', () => {
    it('should be void', () => {
      const deleteGalleryImagesDTO: DeleteGalleryImagesDTO = {
        imageIds: JSON.stringify({
          ids: [imagesRepo[0].id, imagesRepo[1].id],
        }),
      };

      expect(
        controller.deleteGalleryImages(deleteGalleryImagesDTO),
      ).toBeUndefined();
    });
  });

  describe('deleteServices', () => {
    it('should return object holding the number of affected records', () => {
      const deleteServicesDTO: DeleteServicesDTO = {
        serviceIds: JSON.stringify({
          ids: [servicesRepo[0].id],
        }),
      };

      expect(
        controller.deleteServices(offerorsRepo[0].user, deleteServicesDTO),
      ).toMatchObject({ affectedRecords: 1 });
    });
  });

  describe('deleteEvents', () => {
    it('should return object holding the number of affected records', () => {
      const deleteEventsDTO: DeleteEventsDTO = {
        eventIds: JSON.stringify({
          ids: [eventsRepo[0].id],
        }),
      };

      expect(controller.deleteEvents(deleteEventsDTO)).toMatchObject({
        affectedRecords: 1,
      });
    });
  });
});
