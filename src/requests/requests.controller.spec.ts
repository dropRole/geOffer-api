import { Test, TestingModule } from '@nestjs/testing';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import User from '../auth/user.entity';
import MakeRequestDTO from './dto/make-request.dto';
import Offeror from '../offerors/offeror.entity';
import {
  mockOffereesRepo,
  mockOfferorsRepo,
  mockRequestsRepo,
  mockUsersRepo,
} from '../testing-mocks';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import Request from './request.entity';
import { v4 as uuidv4 } from 'uuid';
import Offeree from '../offerees/offeree.entity';
import ObtainRequestsDTO from './dto/obtain-requests.dto';
import AmendRequestProvisionsDTO from './dto/amend-request-provisions.dto';
import AssessReservationTimeDTO from './dto/assess-reservation-time.dto';

let requestsRepo: Request[] = mockRequestsRepo;

describe('RequestsController', () => {
  let controller: RequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
    })
      .useMocker((token) => {
        if (token === RequestsService)
          return {
            makeRequest: jest
              .fn()
              .mockImplementation(
                (
                  user: User,
                  makeRequestDTO: MakeRequestDTO,
                ): { id: string } => {
                  const { idOfferor, seats, cause, note, requestedFor } =
                    makeRequestDTO;

                  const offeror: Offeror = mockOfferorsRepo.find(
                    (offeror) => offeror.id === idOfferor,
                  );

                  if (!offeror)
                    throw new NotFoundException(
                      `Offeror identified with ${idOfferor} was not found.`,
                    );

                  const offeree: Offeree = mockOffereesRepo.find(
                    (offeree) => offeree.user.username === user.username,
                  );

                  const request: Request = {
                    id: uuidv4(),
                    seats,
                    cause,
                    note,
                    requestedAt: new Date().toString(),
                    requestedFor,
                    assessment: undefined,
                    offeree,
                    offeror,
                  };

                  requestsRepo.push(request);

                  return { id: request.id };
                },
              ),
            obtainRequests: jest
              .fn()
              .mockImplementation(
                (user: User, obtainRequestsDTO: ObtainRequestsDTO) => {
                  const { requestedOrder, take } = obtainRequestsDTO;

                  let requests: Request[];

                  if (user.privilege === 'OFFEREE')
                    requests = requestsRepo.filter(
                      (request) =>
                        request.offeree.user.username === user.username,
                    );

                  if (user.privilege === 'OFFEROR')
                    requests = requestsRepo.filter(
                      (request) =>
                        request.offeror.user.username === user.username,
                    );

                  if (requestedOrder === 'ASC')
                    requests = requests.sort((a, b) =>
                      a.requestedAt > b.requestedAt ? -1 : 1,
                    );

                  if (requestedOrder === 'DESC')
                    requests = requests.sort((a, b) =>
                      a.requestedAt > b.requestedAt ? 1 : -1,
                    );

                  return requests.slice(take);
                },
              ),
            amendRequestProvisions: jest
              .fn()
              .mockImplementation(
                (
                  user: User,
                  id: string,
                  amendRequestProvisionsDTO: AmendRequestProvisionsDTO,
                ) => {
                  let amendedRequest: Request | undefined = requestsRepo.find(
                    (request) => request.id === id,
                  );

                  if (!amendedRequest)
                    throw new NotFoundException(
                      `Request identified with ${id} wasn't found.`,
                    );

                  if (amendedRequest.offeree.user.username !== user.username)
                    throw new UnauthorizedException(
                      `You haven't made the ${id} request.`,
                    );

                  const { seats, cause, note } = amendRequestProvisionsDTO;

                  amendedRequest = { ...amendedRequest, seats, cause, note };

                  requestsRepo = requestsRepo.map((request) => {
                    if (request.id === amendedRequest.id) return amendedRequest;

                    return request;
                  });

                  return { id };
                },
              ),
            assessReservationTime: jest
              .fn()
              .mockImplementation(
                (
                  user: User,
                  id: string,
                  assessReservationTimeDTO: AssessReservationTimeDTO,
                ): { id: string } => {
                  const assessedRequest: Request | undefined =
                    requestsRepo.find((request) => request.id === id);

                  if (!assessedRequest)
                    throw new NotFoundException(
                      `Request identified with ${id} wasn't found.`,
                    );

                  if (assessedRequest.offeror.user.username !== user.username)
                    throw new UnauthorizedException(
                      `The ${id} request wasn't intended for you.`,
                    );

                  const { assessment } = assessReservationTimeDTO;

                  assessedRequest.assessment = assessment;

                  return { id: assessedRequest.id };
                },
              ),
            revokeRequest: jest
              .fn()
              .mockImplementation((user: User, id: string): { id: string } => {
                const request: Request = requestsRepo.find(
                  (request) => request.id === id,
                );

                if (!request)
                  throw new NotFoundException(
                    `The request identified with ${id} wasn't found.`,
                  );

                if (request.offeree.user.username !== user.username)
                  throw new UnauthorizedException(
                    `You haven't made the ${id} request.`,
                  );

                requestsRepo = requestsRepo.filter(
                  (request) => request.id !== id,
                );

                return { id };
              }),
          };
      })
      .compile();

    controller = module.get<RequestsController>(RequestsController);
  });

  describe('makeRequest', () => {
    it('should return object that holds id property', () => {
      const todaysDate: Date = new Date();

      const makeRequestDTO: MakeRequestDTO = {
        idOfferor: mockOfferorsRepo[0].id,
        seats: 1,
        cause: 'Soliloquy',
        requestedFor: todaysDate.setHours(todaysDate.getHours() + 3).toString(),
        note: 'On my own.',
      };

      expect(
        controller.makeRequest(mockUsersRepo[1], makeRequestDTO),
      ).toBeDefined();
    });

    it('should throw a NotFoundException', () => {
      const todaysDate: Date = new Date();

      const uuid: string = uuidv4();

      const makeRequestDTO: MakeRequestDTO = {
        idOfferor: uuid,
        seats: 1,
        cause: 'Soliloquy',
        requestedFor: todaysDate.setHours(todaysDate.getHours() + 3).toString(),
        note: 'On my own.',
      };

      expect(() =>
        controller.makeRequest(mockUsersRepo[1], makeRequestDTO),
      ).toThrow(`Offeror identified with ${uuid} was not found.`);
    });
  });

  describe('obtainRequests', () => {
    it('should return an instance of Request array', () => {
      const obtainRequestsDTO: ObtainRequestsDTO = {
        requestedOrder: 'DESC',
        take: 5,
      };

      expect(
        controller.obtainRequests(mockUsersRepo[2], obtainRequestsDTO),
      ).toBeInstanceOf(Array<Request>);
    });
  });

  describe('amendRequestProvisions', () => {
    it('should return an object holding id property', () => {
      const amendRequestProvisionsDTO: AmendRequestProvisionsDTO = {
        seats: 1,
        cause: 'Augmented soliloquy',
        note: undefined,
      };

      expect(
        controller.amendRequestProvisions(
          requestsRepo[requestsRepo.length - 1].id,
          mockUsersRepo[1],
          amendRequestProvisionsDTO,
        ),
      ).toMatchObject<{ id: string }>({
        id: requestsRepo[requestsRepo.length - 1].id,
      });
    });

    it('should throw an UnauthorizedException', () => {
      const amendRequestProvisionsDTO: AmendRequestProvisionsDTO = {
        seats: 1,
        cause: 'Augmented soliloquy',
        note: undefined,
      };

      expect(() =>
        controller.amendRequestProvisions(
          requestsRepo[requestsRepo.length - 1].id,
          mockUsersRepo[2],
          amendRequestProvisionsDTO,
        ),
      ).toThrow(
        `You haven't made the ${
          requestsRepo[requestsRepo.length - 1].id
        } request.`,
      );
    });
  });

  describe('assessReservationTime', () => {
    it('should return an object holding id property', () => {
      const todaysDate: Date = new Date();

      const assessReservationTimeDTO: AssessReservationTimeDTO = {
        assessment: new Date().setDate(todaysDate.getDate() + 4).toString(),
      };

      expect(
        controller.assessReservationTime(
          requestsRepo[requestsRepo.length - 1].id,
          requestsRepo[requestsRepo.length - 1].offeror.user,
          assessReservationTimeDTO,
        ),
      ).toMatchObject<{ id: string }>({
        id: requestsRepo[requestsRepo.length - 1].id,
      });
    });

    it('should throw an UnauthorizedException', () => {
      const todaysDate: Date = new Date();

      const assessReservationTimeDTO: AssessReservationTimeDTO = {
        assessment: new Date().setDate(todaysDate.getDate() + 4).toString(),
      };

      expect(() =>
        controller.assessReservationTime(
          requestsRepo[requestsRepo.length - 1].id,
          requestsRepo[requestsRepo.length - 2].offeror.user,
          assessReservationTimeDTO,
        ),
      ).toThrow(
        `The ${
          requestsRepo[requestsRepo.length - 1].id
        } request wasn't intended for you.`,
      );
    });
  });

  describe('revokeRequest', () => {
    it('should return an object holding id property', () => {
      const id: string = requestsRepo[requestsRepo.length - 1].id;

      expect(
        controller.revokeRequest(
          id,
          requestsRepo[requestsRepo.length - 1].offeree.user,
        ),
      ).toMatchObject<{ id: string }>({
        id,
      });
    });

    it('should throw an UnauthorizedException', () => {
      expect(() =>
        controller.revokeRequest(
          requestsRepo[requestsRepo.length - 1].id,
          requestsRepo[0].offeree.user,
        ),
      ).toThrow(
        `You haven't made the ${
          requestsRepo[requestsRepo.length - 1].id
        } request.`,
      );
    });
  });
});
