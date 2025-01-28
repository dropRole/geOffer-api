import { Test, TestingModule } from '@nestjs/testing';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { User } from '../auth/entities/user.entity';
import MakeRequestDTO from './dto/make-request.dto';
import {
  mockOffereesRepo,
  mockOfferorServicesRepo,
  mockRequestServicesRepo,
  mockRequestsRepo,
  mockUsersRepo,
} from '../testing-mocks';
import { NotFoundException } from '@nestjs/common';
import Request from './entities/request.entity';
import { v4 as uuidv4 } from 'uuid';
import Offeree from '../offerees/entities/offeree.entity';
import ObtainRequestsDTO from './dto/obtain-requests.dto';
import AmendRequestProvisionsDTO from './dto/amend-request-provisions.dto';
import AssessReservationTimeDTO from './dto/assess-reservation-time.dto';
import ServiceToRequest from './entities/service-to-request.entity';
import ServiceToOfferor from 'src/offerors/entities/service-to-offeror.entity';

let requestsRepo: Request[] = mockRequestsRepo;
let requestServicesRepo: ServiceToRequest[] = mockRequestServicesRepo;

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
                  const { note, requestedFor, amount, idOfferorService } =
                    makeRequestDTO;

                  const offeree: Offeree = mockOffereesRepo.find(
                    (offeree) => offeree.user.username === user.username,
                  );

                  const offerorService: ServiceToOfferor =
                    mockOfferorServicesRepo.find(
                      (offerorService) =>
                        offerorService.id === idOfferorService,
                    );

                  const request: Request = {
                    id: uuidv4(),
                    note,
                    requestedAt: new Date().toString(),
                    requestedFor,
                    assessment: undefined,
                    offeree,
                    services: [],
                  };

                  const requestService: ServiceToRequest = {
                    id: uuidv4(),
                    amount,
                    request,
                    serviceToOfferor: offerorService,
                  };

                  request.services = [requestService];

                  requestsRepo.push(request);

                  requestServicesRepo.push(requestService);

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
                    requests = requestsRepo.filter((request) =>
                      request.services.find(
                        (service) =>
                          service.serviceToOfferor.offeror.user.username ===
                          user.username,
                      ),
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
      note: 'On my own.',
      requestedFor: todaysDate.setHours(todaysDate.getHours() + 3).toString(),
      amount: 2,
      idOfferorService: mockOfferorServicesRepo[0].id,
    };

    it('should return an object that holds id property', () => {
      expect(
        controller.makeRequest(mockUsersRepo[1], makeRequestDTO),
      ).toMatchObject({ id: expect.any(String) });
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
