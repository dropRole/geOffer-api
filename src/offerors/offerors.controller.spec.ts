import { Test, TestingModule } from '@nestjs/testing';
import { OfferorsController } from './offerors.controller';
import { OfferorsService } from './offerors.service';
import RecordOfferorDTO from './dto/record-offeror.dto';
import Offeror from './offeror.entity';
import {
  mockOfferorsRepo,
  mockReservationsRepo,
  mockUsersRepo,
} from '../testing-mocks';
import { ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import User from '../auth/user.entity';
import * as bcrypt from 'bcrypt';
import ObtainOfferorsDTO from './dto/obtain-offerors.dto';
import OfferorReputation from './types/offeror-reputation';
import AmendBusinessInfoDTO from './dto/amend-business-info.dto';
import AlterReputationDTO from './dto/alter-reputation.dto';

let usersRepo: User[] = mockUsersRepo;
let offerorsRepo: Offeror[] = mockOfferorsRepo;

describe('OfferorsController', () => {
  let controller: OfferorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OfferorsController],
    })
      .useMocker((token) => {
        if (token === OfferorsService)
          return {
            recordOfferor: jest
              .fn()
              .mockImplementation(
                (recordOfferorDTO: RecordOfferorDTO): { id: string } => {
                  const { username } = recordOfferorDTO;

                  const inUse: Offeror | undefined = offerorsRepo.find(
                    (offeror) => offeror.user.username === username,
                  );

                  if (inUse)
                    throw new ConflictException(
                      `Username ${username} is already in use.`,
                    );

                  const {
                    password,
                    name,
                    address,
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
                    address: JSON.parse(address),
                    telephone,
                    email,
                    businessHours,
                    reputation: {
                      responsiveness: 10,
                      compliance: 10,
                      timeliness: 10,
                    },
                    user,
                    requests: [],
                  };

                  offerorsRepo.push(offeror);

                  return { id: offeror.id };
                },
              ),
            obtainOfferors: jest
              .fn()
              .mockImplementation((obtainOfferorsDTO: ObtainOfferorsDTO) => {
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

                obtainedOfferors = offerors.map((offeror: ObtainedOfferor) => {
                  let reservationsMade = 0;

                  mockReservationsRepo.forEach((reservation) => {
                    if (reservation.request.offeror.id === offeror.id)
                      reservationsMade++;
                  });

                  return { ...offeror, reservationsMade };
                });

                if (reservationsMade === 'ASC')
                  obtainedOfferors.sort((a, b) =>
                    a.reservationsMade > b.reservationsMade ? 1 : -1,
                  );

                if (reservationsMade === 'DESC')
                  obtainedOfferors.sort((a, b) =>
                    a.reservationsMade > b.reservationsMade ? -1 : 1,
                  );

                return obtainedOfferors.slice(0, take);
              }),
            claimBusinessInfo: jest.fn().mockImplementation((user: User) => {
              const offeror: Offeror = mockOfferorsRepo.find(
                (offeror) => offeror.user.username === user.username,
              );

              const { name, address, telephone, email, businessHours } =
                offeror;

              return { name, address, telephone, email, businessHours };
            }),
            claimReputation: jest.fn().mockImplementation((user: User) => {
              const offeror: Offeror = mockOfferorsRepo.find(
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
                (user: User, amendBusinessInfoDTO: AmendBusinessInfoDTO) => {
                  let id: string;

                  offerorsRepo = offerorsRepo.map((offeror) => {
                    if (offeror.user.username === user.username) {
                      id = offeror.id;

                      return {
                        ...offeror,
                        address: JSON.stringify(offeror.address),
                        ...amendBusinessInfoDTO,
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
            alterReputation: jest
              .fn()
              .mockImplementation(
                (id: string, alterReputationDTO: AlterReputationDTO) => {
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
          };
      })
      .compile();

    controller = module.get<OfferorsController>(OfferorsController);
  });

  describe('recordOfferor', () => {
    it('should return an object that holds an id property', () => {
      const dto: RecordOfferorDTO = {
        username: 'doghouse',
        password: 'dogHouse@60',
        name: 'Dog House',
        address: JSON.stringify({
          street: { name: 'Central Ave SW', numeration: '1216' },
          city: { name: 'Albuquerque', postalCode: '87102' },
          country: 'New Mexico',
        }),
        telephone: '(505) 913 761',
        email: 'doghouse@email.com',
        businessHours:
          '7am - 10pm Monday - Thursday; 7am - 12am Friday - Saturday; 7am - 9pm Sunday',
      };

      expect(controller.recordOfferor(dto)).toMatchObject<{ id: string }>({
        id: expect.any(String),
      });
    });

    it('should throw a ConflictException', () => {
      const dto: RecordOfferorDTO = {
        username: 'lalosalamanca',
        password: 'dogHouse@60',
        name: 'Dog House',
        address: JSON.stringify({
          street: { name: 'Central Ave SW', numeration: '1216' },
          city: { name: 'Albuquerque', postalCode: '87102' },
          country: 'New Mexico',
        }),
        telephone: '(505) 913 761',
        email: 'doghouse@email.com',
        businessHours:
          '7am - 10pm Monday - Thursday; 7am - 12am Friday - Saturday; 7am - 9pm Sunday',
      };

      expect(() => controller.recordOfferor(dto)).toThrow(
        `Username ${dto.username} is already in use.`,
      );
    });
  });

  describe('obtainOfferors', () => {
    it('should return an instance of Offeror array', () => {
      const dto: ObtainOfferorsDTO = {
        name: 'Los Pollos Hermanos',
        city: 'Albaquerque',
        reservationsMade: 'ASC',
        take: 10,
      };

      expect(controller.obtainOfferors(dto)).toBeInstanceOf(Array<Offeror>);
    });
  });

  describe('claimBusinessInfo', () => {
    it('should return an object that holds name, address, telephone, email, and businessHours properties', () => {
      expect(controller.claimBusinessInfo(usersRepo[5])).toMatchObject<
        Omit<Offeror, 'id' | 'reputation' | 'user' | 'requests'>
      >({
        name: expect.any(String),
        address: expect.any(Object),
        telephone: expect.any(String),
        email: expect.any(String),
        businessHours: expect.any(String),
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
    it('should return an object that holds id property', () => {
      expect(
        controller.amendBusinessInfo(usersRepo[5], {
          name: offerorsRepo[1].name,
          address: JSON.stringify(offerorsRepo[1].address),
          telephone: offerorsRepo[1].telephone,
          email: offerorsRepo[1].email,
          businessHours: offerorsRepo[1].businessHours,
        }),
      ).toMatchObject<{ id: string }>({
        id: expect.any(String),
      });
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
});
