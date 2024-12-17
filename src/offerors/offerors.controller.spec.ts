import { Test, TestingModule } from '@nestjs/testing';
import { OfferorsController } from './offerors.controller';
import { OfferorsService } from './offerors.service';
import RecordOfferorDTO from './dto/record-offeror.dto';
import Offeror from './offeror.entity';
import {
  mockOfferorsRepo,
  mockReservationsRepo,
  mockUsersRepo,
  mockOfferorImagesRepo,
} from '../testing-mocks';
import { ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import User from '../auth/user.entity';
import * as bcrypt from 'bcrypt';
import ObtainOfferorsDTO from './dto/obtain-offerors.dto';
import { OfferorReputation } from './types';
import AmendBusinessInfoDTO from './dto/amend-business-info.dto';
import AlterReputationDTO from './dto/alter-reputation.dto';
import OfferorImage from './offeror-images.entity';
import { DeleteGalleryImagesDTO } from './dto/delete-gallery-images.dto';

let usersRepo: User[] = mockUsersRepo;
let offerorsRepo: Offeror[] = mockOfferorsRepo;
let offerorImagesRepo: OfferorImage[] = mockOfferorImagesRepo;

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
                  address,
                  coordinates,
                  email,
                  telephone,
                  service,
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
                  address: JSON.parse(address),
                  coordinates: JSON.parse(coordinates),
                  telephone,
                  email,
                  service: JSON.parse(service),
                  businessHours: JSON.parse(businessHours),
                  reputation: {
                    responsiveness: 10,
                    compliance: 10,
                    timeliness: 10,
                  },
                  user,
                  requests: [],
                  images: [],
                  events: [],
                };

                const highlightImage: OfferorImage = {
                  id: uuidv4(),
                  offeror,
                  type: 'HIGHLIGHT',
                  destination: files.highlight.destination,
                };

                offerorImagesRepo.push(highlightImage);

                offeror.images.push(highlightImage);

                for (const galleryImage of files.gallery) {
                  const image: OfferorImage = {
                    id: uuidv4(),
                    offeror,
                    type: 'GALLERY',
                    destination: galleryImage.destination,
                  };

                  offerorImagesRepo.push(image);

                  offeror.images.push(image);
                }

                offerorsRepo.push(offeror);

                return { id: offeror.id };
              },
            ),
            addGalleryImages: jest
              .fn()
              .mockImplementation(
                (
                  user: User,
                  files: { gallery: Express.Multer.File[] },
                ): void => {
                  offerorsRepo = offerorsRepo.map((offeror) => {
                    if (offeror.user.username === user.username) {
                      for (const galleryImage of files.gallery) {
                        const image: OfferorImage = {
                          id: uuidv4(),
                          offeror,
                          type: 'GALLERY',
                          destination: galleryImage.destination,
                        };

                        offerorImagesRepo.push(image);

                        offeror.images.push(image);
                      }
                    }

                    return offeror;
                  });
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
                        if (reservation.request.offeror.id === offeror.id)
                          reservationsMade++;
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
                ): Omit<
                  Offeror,
                  | 'id'
                  | 'coordinates'
                  | 'reputation'
                  | 'user'
                  | 'requests'
                  | 'images'
                  | 'events'
                > => {
                  const offeror: Offeror = offerorsRepo.find(
                    (offeror) => offeror.user.username === user.username,
                  );

                  const {
                    name,
                    address,
                    telephone,
                    email,
                    service,
                    businessHours,
                  } = offeror;

                  return {
                    name,
                    address,
                    telephone,
                    email,
                    service,
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

                const {
                  reputation: { responsiveness, compliance, timeliness },
                } = offeror;

                return { responsiveness, compliance, timeliness };
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
                        telephone: amendBusinessInfoDTO.telephone,
                        email: amendBusinessInfoDTO.email,
                        service: JSON.parse(amendBusinessInfoDTO.service),
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
            changeHighlightImage: jest
              .fn()
              .mockImplementation(
                (
                  user: User,
                  files: { highlight: Express.Multer.File },
                ): void => {
                  offerorsRepo = offerorsRepo.map((offeror) => {
                    if (offeror.user.username === user.username) {
                      offeror.images.map((image) => {
                        if (image.type === 'HIGHLIGHT') {
                          image.destination = files.highlight.destination;

                          return image;
                        }

                        return image;
                      });
                    }

                    return offeror;
                  });

                  offerorImagesRepo = offerorImagesRepo.map((image) => {
                    if (
                      image.offeror.user.username === user.username &&
                      image.type === 'HIGHLIGHT'
                    ) {
                      image.destination = files.highlight.destination;
                    }

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

                  offerorImagesRepo = offerorImagesRepo.filter(
                    (image) => !ids.find((id) => id === image.id),
                  );
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
      address: JSON.stringify({
        street: { name: 'Cara Lazara', numeration: '7' },
        city: { name: 'Čačak', postalCode: '32000' },
        country: 'Serbia',
      }),
      coordinates: JSON.stringify({ latitude: 0, longitude: 0 }),
      telephone: '032 343878',
      email: 'cafeenigma@email.com',
      service: JSON.stringify({
        category: 'Café/Pub',
        service: {
          name: 'Drinking',
          description: 'Alcoholic and nonalcoholic drinks',
        },
      }),
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

  describe('addGalleryImages', () => {
    it('should be void', () => {
      const files: { gallery: Express.Multer.File[] } = {
        gallery: [
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
        ],
      };

      expect(
        controller.addGalleryImages(
          offerorsRepo[offerorsRepo.length - 1].user,
          files,
        ),
      ).toBeUndefined();
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
      >({
        name: expect.any(String),
        address: expect.any(Object),
        telephone: expect.any(String),
        email: expect.any(String),
        service: expect.any(Object),
        businessHours: expect.any(Object),
      });
    });
  });

  describe('claimReputation', () => {
    it('should return an object that holds responsiveness, compliance, timeliness properties', () => {
      expect(
        controller.claimReputation(usersRepo[5]),
      ).toMatchObject<OfferorReputation>({
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
          telephone: offerorsRepo[1].telephone,
          email: offerorsRepo[1].email,
          service: JSON.stringify(offerorsRepo[1].service),
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

  describe('changeHighlightImage', () => {
    it('should be void', () => {
      const files: { highlight: Express.Multer.File } = {
        highlight: {
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
        },
      };

      expect(
        controller.changeHighlightImage(
          offerorsRepo[offerorsRepo.length - 1].user,
          files,
        ),
      ).toBeUndefined();
    });
  });

  describe('deleteGalleryImages', () => {
    it('should be void', () => {
      const deleteGalleryImagesDTO: DeleteGalleryImagesDTO = {
        imageIds: JSON.stringify({
          ids: [offerorImagesRepo[0].id, offerorImagesRepo[1].id],
        }),
      };

      expect(
        controller.deleteGalleryImages(deleteGalleryImagesDTO),
      ).toBeUndefined();
    });
  });
});
