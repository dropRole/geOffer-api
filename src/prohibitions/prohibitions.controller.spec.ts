import { Test, TestingModule } from '@nestjs/testing';
import { ProhibitionsController } from './prohibitions.controller';
import { ProhibitionsService } from './prohibitions.service';
import Prohibition from './prohibition.entity';
import {
  mockIncidentsRepo,
  mockOffereesRepo,
  mockProhibitionsRepo,
  mockUsersRepo,
} from '../testing-mocks';
import DeclareProhibitionDTO from './dto/declare-prohibition.dto';
import Incident from '../incidents/incident.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import User from 'src/auth/user.entity';
import ObtainProhibitionsDTO from './dto/obtain-prohibitions.dto';
import AlterTimeframeDTO from './dto/alter-timeframe.dto';

type CronJobOptions = {
  delay: (id: string, timeout: number) => void;
};

type CronJobData = Pick<Prohibition, 'id'>;

type CronJob = {
  id: number;
  options: CronJobOptions;
  data: CronJobData;
};

let prohibitionsRepo: Prohibition[] = mockProhibitionsRepo;
let cronJobsRepo: CronJob[] = [];

describe('ProhibitionsController', () => {
  let controller: ProhibitionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProhibitionsController],
    })
      .useMocker((token) => {
        if (token === ProhibitionsService)
          return {
            declareProhibition: jest
              .fn()
              .mockImplementation(
                (
                  declareProhibitionDTO: DeclareProhibitionDTO,
                ): { id: string } => {
                  const { beginning, termination, idIncident } =
                    declareProhibitionDTO;

                  const incident: Incident = mockIncidentsRepo.find(
                    (incident) => incident.id === idIncident,
                  );

                  if (!incident)
                    throw new NotFoundException(
                      `The incident identified with ${idIncident} wasn't found.`,
                    );

                  const prohibited: Prohibition | undefined =
                    prohibitionsRepo.find(
                      (prohibition) => prohibition.incident.id === idIncident,
                    );

                  if (prohibited)
                    throw new ConflictException(
                      `The prohibition for the ${idIncident} incident was declared.`,
                    );

                  const prohibition: Prohibition = {
                    id: uuidv4(),
                    beginning,
                    termination,
                    incident,
                  };

                  prohibitionsRepo.push(prohibition);

                  cronJobsRepo.push({
                    id: 1,
                    options: {
                      delay(id, timeout) {
                        setTimeout(() => {
                          prohibitionsRepo = prohibitionsRepo.filter(
                            (prohibition) => prohibition.id !== id,
                          );
                        }, timeout);
                      },
                    },
                    data: { id: prohibition.id },
                  });

                  return { id: prohibition.id };
                },
              ),
            obtainProhibitions: jest
              .fn()
              .mockImplementation(
                (
                  user: User,
                  obtainProhibitionsDTO: ObtainProhibitionsDTO,
                ): Prohibition[] => {
                  const { idOfferee, idOfferor, prohibitedOrder, take } =
                    obtainProhibitionsDTO;

                  let prohibitions: Prohibition[];

                  switch (user.privilege) {
                    case 'SUPERUSER':
                      if (idOfferee)
                        prohibitions = prohibitionsRepo.filter(
                          (prohibition) =>
                            prohibition.incident.reservation.request.offeree
                              .id === idOfferee,
                        );

                      if (idOfferor)
                        prohibitions = prohibitionsRepo.filter(
                          (prohibition) =>
                            prohibition.incident.reservation.request.offeror
                              .id === idOfferor,
                        );
                      break;
                    case 'OFFEREE':
                      prohibitions = prohibitionsRepo.filter(
                        (prohibition) =>
                          prohibition.incident.reservation.request.offeree.user
                            .username === user.username,
                      );
                      break;
                    case 'OFFEROR':
                      prohibitions = prohibitionsRepo.filter(
                        (prohibition) =>
                          prohibition.incident.reservation.request.offeror.user
                            .username === user.username,
                      );
                      break;
                  }

                  if (prohibitedOrder === 'ASC')
                    prohibitions = prohibitions.sort((a, b) =>
                      new Date(a.beginning) > new Date(b.beginning) ? -1 : 1,
                    );

                  if (prohibitedOrder === 'DESC')
                    prohibitions = prohibitions.sort((a, b) =>
                      new Date(a.beginning) > new Date(b.beginning) ? 1 : -1,
                    );

                  return prohibitions.slice(take);
                },
              ),
            alterTimeframe: jest
              .fn()
              .mockImplementation(
                (
                  id: string,
                  alterTimeframeDTO: AlterTimeframeDTO,
                ): { id: string } => {
                  const { termination } = alterTimeframeDTO;

                  const prohibition: Prohibition | undefined =
                    prohibitionsRepo.find(
                      (prohibition) => prohibition.id === id,
                    );

                  if (!prohibition)
                    throw new NotFoundException(
                      `The prohibition ${id} wasn't found.`,
                    );

                  prohibition.termination = termination;

                  cronJobsRepo.filter((job) => job.data.id !== id);

                  cronJobsRepo.push({
                    id: 1,
                    options: {
                      delay(id, termination) {
                        setTimeout(() => {
                          prohibitionsRepo = prohibitionsRepo.filter(
                            (prohibition) => prohibition.id !== id,
                          );
                        }, termination);
                      },
                    },
                    data: { id: prohibition.id },
                  });

                  return { id };
                },
              ),
            disdeclareProhibition: jest
              .fn()
              .mockImplementation((id: string): { id: string } => {
                const prohibition: Prohibition | undefined =
                  prohibitionsRepo.find((prohibition) => prohibition.id === id);

                if (!prohibition)
                  throw new NotFoundException(
                    `The prohibition ${id} wasn't found.`,
                  );

                cronJobsRepo.filter((job) => job.data.id !== id);

                prohibitionsRepo.filter((prohibition) => prohibition.id !== id);

                return { id };
              }),
          };
      })
      .compile();

    controller = module.get<ProhibitionsController>(ProhibitionsController);
  });

  describe('declareProhibition', () => {
    const todaysDate: Date = new Date();

    const declareProhibitionDTO: DeclareProhibitionDTO = {
      beginning: todaysDate.toString(),
      termination: new Date(
        todaysDate.setDate(todaysDate.getDate() + 3),
      ).toString(),
      idIncident: mockIncidentsRepo[mockIncidentsRepo.length - 1].id,
    };

    it('should return an object carrying id property', () => {
      expect(
        controller.declareProhibition(declareProhibitionDTO),
      ).toMatchObject<{ id: string }>({ id: expect.any(String) });
    });

    it('should throw a ConflictException', () => {
      declareProhibitionDTO.idIncident = mockIncidentsRepo[1].id;

      expect(() =>
        controller.declareProhibition(declareProhibitionDTO),
      ).toThrow(
        `The prohibition for the ${declareProhibitionDTO.idIncident} incident was declared.`,
      );
    });
  });

  describe('obtainProhibitions', () => {
    it('should return an instance of Prohibition array', () => {
      const obtainProhibitionsDTO: ObtainProhibitionsDTO = {
        idOfferee: mockOffereesRepo[0].id,
        idOfferor: undefined,
        prohibitedOrder: 'DESC',
        take: 10,
      };

      expect(
        controller.obtainProhibitions(mockUsersRepo[1], obtainProhibitionsDTO),
      ).toBeInstanceOf(Array<Prohibition>);
    });
  });

  describe('alterTimeframe', () => {
    let id: string = prohibitionsRepo[prohibitionsRepo.length - 1].id;

    it('should return an object carrying id property', () => {
      const todaysDate: Date = new Date();

      expect(
        controller.alterTimeframe(id, {
          termination: new Date(
            todaysDate.setDate(todaysDate.getDate() + 3),
          ).toString(),
        }),
      ).toMatchObject<{ id: string }>({ id });
    });

    it('should throw a NotFoundException', () => {
      id = uuidv4();

      const todaysDate: Date = new Date();

      expect(() =>
        controller.alterTimeframe(id, {
          termination: new Date(
            todaysDate.setDate(todaysDate.getDate() + 3),
          ).toString(),
        }),
      ).toThrow(`The prohibition ${id} wasn't found.`);
    });
  });

  describe('disdeclareProhibition', () => {
    it('should return an object carrying id property', () => {
      const id: string = prohibitionsRepo[prohibitionsRepo.length - 1].id;

      expect(controller.disdeclareProhibition(id)).toMatchObject<{
        id: string;
      }>({
        id,
      });
    });
  });
});
