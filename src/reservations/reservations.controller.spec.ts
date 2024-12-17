import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import MakeReservationDTO from './dto/make-reservation.dto';
import User from '../auth/user.entity';
import Reservation from './reservation.entity';
import {
  mockIncidentsRepo,
  mockOffereesRepo,
  mockRequestsRepo,
  mockReservationsRepo,
  mockUsersRepo,
} from '../testing-mocks';
import Request from '../requests/request.entity';
import { v4 as uuidv4 } from 'uuid';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import ObtainReservationsDTO from './dto/obtain-reservations.dto';
import Incident from 'src/incidents/incident.entity';

let reservationsRepo: Reservation[] = mockReservationsRepo;

describe('ReservationsController', () => {
  let controller: ReservationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationsController],
    })
      .useMocker((token) => {
        if (token === ReservationsService)
          return {
            makeReservation: jest
              .fn()
              .mockImplementation(
                (makeReservationDTO: MakeReservationDTO): { id: string } => {
                  const { idRequest } = makeReservationDTO;

                  const request: Request = mockRequestsRepo.find(
                    (request) => request.id === idRequest,
                  );

                  if (!request)
                    throw new NotFoundException(
                      `Request identified with ${request.id} wasn't found.`,
                    );

                  let reservation: Reservation = reservationsRepo.find(
                    (reservation) => reservation.request.id === request.id,
                  );

                  if (reservation)
                    throw new ConflictException(
                      `The request ${request.id} is already reserved.`,
                    );

                  let code = '';

                  const todaysDate: { type: string; value: string }[] =
                    new Intl.DateTimeFormat('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    }).formatToParts();

                  todaysDate.forEach((part) =>
                    part.value.match(/,|\/|:| /g) === null
                      ? (code += part.value)
                      : undefined,
                  );

                  code += `_${
                    request.offeree.user.username.substring(0, 1) +
                    request.offeree.user.username.substring(
                      request.offeree.user.username.length,
                      request.offeree.user.username.length - 1,
                    )
                  }`;

                  reservation = {
                    id: uuidv4(),
                    code,
                    request,
                    reserved: new Date().toString(),
                    incidents: [],
                  };

                  reservationsRepo.push(reservation);

                  return { id: reservation.id };
                },
              ),
            obtainReservations: jest
              .fn()
              .mockImplementation(
                (
                  user: User,
                  obtainReservationsDTO: ObtainReservationsDTO,
                ): Reservation[] => {
                  const {
                    idOfferee,
                    idOfferor,
                    reservationPeriod,
                    reservedOrder,
                    take,
                  } = obtainReservationsDTO;

                  let reservations: Reservation[];

                  switch (user.privilege) {
                    case 'SUPERUSER':
                      if (idOfferee)
                        reservations = reservationsRepo.filter(
                          (reservations) =>
                            reservations.request.offeree.id === idOfferee,
                        );

                      if (idOfferor)
                        reservations = reservationsRepo.filter(
                          (reservations) =>
                            reservations.request.offeror.id === idOfferor,
                        );
                      break;
                    case 'OFFEREE':
                      reservations = reservationsRepo.filter(
                        (reservations) =>
                          reservations.request.offeree.user.username ===
                          user.username,
                      );
                      break;
                    case 'OFFEROR':
                      reservations = reservationsRepo.filter(
                        (reservations) =>
                          reservations.request.offeree.user.username ===
                          user.username,
                      );
                      break;
                  }

                  const todaysDate: Date = new Date();

                  switch (reservationPeriod) {
                    case 'TODAY':
                      reservations = reservations.filter(
                        (reservation) =>
                          new Date(reservation.reserved).getTime() ===
                          todaysDate.getTime(),
                      );
                      break;
                    case 'WEEK':
                      reservations = reservations.filter(
                        (reservation) =>
                          new Date(reservation.reserved).getTime() >=
                            new Date(
                              todaysDate.setDate(todaysDate.getDate() - 7),
                            ).getTime() &&
                          new Date(reservation.reserved).getTime() <=
                            todaysDate.getTime(),
                      );
                      break;
                    case 'MONTH':
                      reservations = reservations.filter(
                        (reservation) =>
                          new Date(reservation.reserved).getTime() >=
                            new Date(
                              todaysDate.setDate(todaysDate.getDate() - 31),
                            ).getTime() &&
                          new Date(reservation.reserved).getTime() <=
                            todaysDate.getTime(),
                      );
                      break;
                  }

                  if (reservedOrder === 'ASC')
                    reservations = reservations.sort((a, b) =>
                      new Date(a.reserved) > new Date(b.reserved) ? -1 : 1,
                    );

                  if (reservedOrder === 'DESC')
                    reservations = reservations.sort((a, b) =>
                      new Date(a.reserved) > new Date(b.reserved) ? 1 : -1,
                    );

                  return reservations.slice(0, take);
                },
              ),
            withdrawReservation: jest
              .fn()
              .mockImplementation((id: string): { id: string } => {
                const reservation: Reservation = reservationsRepo.find(
                  (request) => request.id === id,
                );

                if (!reservation)
                  throw new NotFoundException(
                    `Request identified with ${reservation.id} wasn't found.`,
                  );

                const incident: Incident = mockIncidentsRepo.find(
                  (incident) => incident.reservation.id === id,
                );

                if (incident)
                  throw new ConflictException(
                    `There're pending incidents on the reservation.`,
                  );

                reservationsRepo = reservationsRepo.filter(
                  (reservation) => reservation.id !== id,
                );

                return { id };
              }),
          };
      })
      .compile();

    controller = module.get<ReservationsController>(ReservationsController);
  });

  describe('makeReservation', () => {
    const makeReservationDTO: MakeReservationDTO = {
      idRequest: mockRequestsRepo[mockRequestsRepo.length - 1].id,
    };

    it('should return an object holding id property', () => {
      expect(controller.makeReservation(makeReservationDTO)).toMatchObject<{
        id: string;
      }>({
        id: expect.any(String),
      });
    });

    it('should throw ConflictException', () => {
      expect(() => controller.makeReservation(makeReservationDTO)).toThrow(
        `The request ${makeReservationDTO.idRequest} is already reserved.`,
      );
    });
  });

  describe('obtainReservations', () => {
    it('should return an instance of the Reservation array', () => {
      const obtainReservationsDTO: ObtainReservationsDTO = {
        idOfferee: mockOffereesRepo[0].id,
        idOfferor: undefined,
        reservationPeriod: 'WEEK',
        reservedOrder: 'ASC',
        take: 3,
      };

      expect(
        controller.obtainReservations(mockUsersRepo[0], obtainReservationsDTO),
      ).toBeInstanceOf(Array<Reservation>);
    });
  });

  describe('withdrawReservation', () => {
    it('should return an object holding id property', () => {
      const id: string = reservationsRepo[reservationsRepo.length - 1].id;

      expect(controller.withdrawReservation(id)).toMatchObject<{ id: string }>({
        id,
      });
    });
  });
});
