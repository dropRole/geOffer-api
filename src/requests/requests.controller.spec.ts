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
                  const { idOfferor, service, note, requestedFor } =
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
                    service: JSON.parse(service),
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
                (
                  user: User,
                  obtainRequestsDTO: ObtainRequestsDTO,
                ): Request[] => {
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
                  id: string,
                  amendRequestProvisionsDTO: AmendRequestProvisionsDTO,
                ): { id: string } => {
                  let amendedRequest: Request | undefined = requestsRepo.find(
                    (request) => request.id === id,
                  );

                  if (!amendedRequest)
                    throw new NotFoundException(
                      `Request identified with ${id} wasn't found.`,
                    );

                  const { note } = amendRequestProvisionsDTO;

                  amendedRequest = { ...amendedRequest, note };

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
                  id: string,
                  assessReservationTimeDTO: AssessReservationTimeDTO,
                ): { id: string } => {
                  const assessedRequest: Request | undefined =
                    requestsRepo.find((request) => request.id === id);

                  if (!assessedRequest)
                    throw new NotFoundException(
                      `Request identified with ${id} wasn't found.`,
                    );

                  const { assessment } = assessReservationTimeDTO;

                  assessedRequest.assessment = assessment;

                  return { id: assessedRequest.id };
                },
              ),
            revokeRequest: jest
              .fn()
              .mockImplementation((id: string): { id: string } => {
                const request: Request = requestsRepo.find(
                  (request) => request.id === id,
                );

                if (!request)
                  throw new NotFoundException(
                    `The request identified with ${id} wasn't found.`,
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
    const todaysDate: Date = new Date();

    const makeRequestDTO: MakeRequestDTO = {
      idOfferor: mockOfferorsRepo[0].id,
      service: JSON.stringify({ name: 'Dining' }),
      note: 'On my own.',
      requestedFor: todaysDate.setHours(todaysDate.getHours() + 3).toString(),
    };

    it('should return object that holds id property', () => {
      expect(
        controller.makeRequest(mockUsersRepo[1], makeRequestDTO),
      ).toBeDefined();
    });

    it('should throw a NotFoundException', () => {
      const uuid: string = uuidv4();

      makeRequestDTO.idOfferor = uuid;

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
        note: 'Mistake, table for two.',
      };

      expect(
        controller.amendRequestProvisions(
          requestsRepo[requestsRepo.length - 1].id,
          amendRequestProvisionsDTO,
        ),
      ).toMatchObject<{ id: string }>({
        id: requestsRepo[requestsRepo.length - 1].id,
      });
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
          assessReservationTimeDTO,
        ),
      ).toMatchObject<{ id: string }>({
        id: requestsRepo[requestsRepo.length - 1].id,
      });
    });
  });

  describe('revokeRequest', () => {
    it('should return an object holding id property', () => {
      const id: string = requestsRepo[requestsRepo.length - 1].id;

      expect(controller.revokeRequest(id)).toMatchObject<{ id: string }>({
        id,
      });
    });
  });
});
