import { Test, TestingModule } from '@nestjs/testing';
import { OffereesController } from './offerees.controller';
import { OffereesService } from './offerees.service';
import Offeree from './offeree.entity';
import ObtainOffereesDTO from './dto/obtain-offerees.dto';
import {
  mockProhibitionsRepo,
  mockRequestsRepo,
  mockUsersRepo,
  mockOffereesRepo,
} from '../testing-mocks';
import User from 'src/auth/user.entity';
import AmendBasicsDTO from './dto/amend-basics.dto';

let offereesRepo: Offeree[] = mockOffereesRepo;

describe('OffereesController', () => {
  let controller: OffereesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OffereesController],
    })
      .useMocker((token) => {
        if (token === OffereesService)
          return {
            obtainOfferees: jest
              .fn()
              .mockImplementation(
                (obtainOffereesDTO: ObtainOffereesDTO): Offeree[] => {
                  type ObtainedOfferee = Offeree & {
                    requestsMade: number;
                  };

                  const { fullname, requestsMade, prohibited, take } =
                    obtainOffereesDTO;

                  const upperFullname: string = fullname.toUpperCase();

                  let offerees: Offeree[] = offereesRepo.filter((offeree) =>
                    (offeree.name || offeree.surname)
                      .toUpperCase()
                      .match(`/${upperFullname}/g`),
                  );

                  if (prohibited)
                    offerees = offerees.filter((offeree) =>
                      mockProhibitionsRepo.some(
                        (prohibition) =>
                          prohibition.incident.reservation.request.offeree
                            .id === offeree.id,
                      ),
                    );

                  const obtainedOfferees: ObtainedOfferee[] = offerees.map(
                    (offeree: ObtainedOfferee) => {
                      let requestsMade = 0;

                      mockRequestsRepo.forEach((request) => {
                        if (request.offeree.id === offeree.id) requestsMade++;
                      });

                      return {
                        ...offeree,
                        requestsMade,
                      };
                    },
                  );

                  if (requestsMade === 'ASC')
                    obtainedOfferees.sort((a, b) =>
                      a.requestsMade > b.requestsMade ? 1 : -1,
                    );

                  if (requestsMade === 'DESC')
                    obtainedOfferees.sort((a, b) =>
                      a.requestsMade > b.requestsMade ? -1 : 1,
                    );

                  return obtainedOfferees.slice(0, take);
                },
              ),
            claimBasics: jest
              .fn()
              .mockImplementation(
                (user: User): Pick<Offeree, 'name' | 'surname' | 'email'> => {
                  const offeree: Offeree = offereesRepo.find(
                    (offeree) => offeree.user.username === user.username,
                  );

                  const { name, surname, email } = offeree;

                  return { name, surname, email };
                },
              ),
            amendBasics: jest
              .fn()
              .mockImplementation(
                (user: User, amendBasicsDTO: AmendBasicsDTO): void => {
                  offereesRepo = offereesRepo.map((offeree) => {
                    if (offeree.user.username === user.username) {
                      offeree = { ...offeree, ...amendBasicsDTO };

                      return offeree;
                    }
                  });
                },
              ),
          };
      })
      .compile();

    controller = module.get<OffereesController>(OffereesController);
  });

  describe('obtainOfferees', () => {
    it('should return an array of Offeree instances', () => {
      expect(
        controller.obtainOfferees({
          fullname: 'Lalo Salamanca',
          requestsMade: 'DESC',
          prohibited: false,
          take: 5,
        }),
      ).toBeInstanceOf(Array<Offeree>);
    });
  });

  describe('claimBasics', () => {
    it('should return an object that holds name, surname and email properties', () => {
      expect(controller.claimBasics(mockUsersRepo[1])).toMatchObject<
        Pick<Offeree, 'name' | 'surname' | 'email'>
      >({
        name: expect.any(String),
        surname: expect.any(String),
        email: expect.any(String),
      });
    });
  });

  describe('amendBasics', () => {
    it('should be void', () => {
      expect(
        controller.amendBasics(mockUsersRepo[1], {
          name: `${offereesRepo[0].name}_amend`,
          surname: `${offereesRepo[0].surname}_amend`,
          email: `${offereesRepo[0].email}_amend`,
        }),
      ).toBeUndefined();
    });
  });
});
