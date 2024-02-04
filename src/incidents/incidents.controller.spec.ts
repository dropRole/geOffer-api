import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import User from '../auth/user.entity';
import OpenIncidentDTO from './dto/open-incident.dto';
import Reservation from '../reservations/reservation.entity';
import { mockIncidentsRepo, mockReservationsRepo } from '../testing-mocks';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import Incident from './incident.entity';
import ObtainIncidentsDTO from './dto/obtain-incidents.dto';
import RenameIncidentDTO from './dto/rename-incident.dto';
import AlterIncidentStatusDTO from './dto/alter-incident-status.dto';
import IncidentStatus from './types/incident-status';

let incidentsRepo: Incident[] = mockIncidentsRepo;

describe('IncidentsController', () => {
  let controller: IncidentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentsController],
    })
      .useMocker((token) => {
        if (token === IncidentsService)
          return {
            openIncident: jest
              .fn()
              .mockImplementation(
                (
                  user: User,
                  openIncidentDTO: OpenIncidentDTO,
                ): { id: string } => {
                  const { title, idReservation } = openIncidentDTO;

                  const reservation: Reservation = mockReservationsRepo.find(
                    (reservation) => reservation.id === idReservation,
                  );

                  if (!reservation)
                    throw new NotFoundException(
                      `The reservation identified with ${idReservation} wasn't found.`,
                    );

                  if (
                    reservation.request.offeree.user.username !==
                      user.username &&
                    reservation.request.offeror.user.username !== user.username
                  )
                    throw new UnauthorizedException(
                      `Cannot open an incident due to not being a participant in the ${idReservation} reservation.`,
                    );

                  const incident: Incident = {
                    id: uuidv4(),
                    title,
                    status: 'PENDING',
                    opened: new Date().toString(),
                    openedBy: user,
                    conclusion: undefined,
                    reservation,
                    complaints: [],
                  };

                  incidentsRepo.push(incident);

                  return { id: incident.id };
                },
              ),
            obtainIncidents: jest
              .fn()
              .mockImplementation(
                (
                  user: User,
                  idReservation: string,
                  obtainIncidentsDTO: ObtainIncidentsDTO,
                ): Incident[] => {
                  const reservation: Reservation = mockReservationsRepo.find(
                    (reservation) => reservation.id === idReservation,
                  );

                  if (!reservation)
                    throw new NotFoundException(
                      `The reservation identified with ${idReservation} wasn't found.`,
                    );

                  if (
                    reservation.request.offeree.user.username !==
                      user.username &&
                    reservation.request.offeror.user.username !== user.username
                  )
                    throw new UnauthorizedException(
                      `Cannot obtain incidents due to not being a participant in the ${idReservation} reservation.`,
                    );

                  const { status } = obtainIncidentsDTO;

                  let incidents: Incident[];

                  incidents = incidentsRepo.filter(
                    (incident) => incident.reservation.id === idReservation,
                  );

                  if (status)
                    incidents = incidentsRepo.filter(
                      (incident) => incident.status === status,
                    );

                  return incidents;
                },
              ),
            renameIncident: jest
              .fn()
              .mockImplementation(
                (
                  user: User,
                  id: string,
                  renameIncidentDTO: RenameIncidentDTO,
                ): { id: string } => {
                  const renamedIncident: Incident = incidentsRepo.find(
                    (incident) => incident.id === id,
                  );

                  if (!renamedIncident)
                    throw new NotFoundException(
                      `The incident identified with ${id} wasn't found.`,
                    );

                  if (
                    renamedIncident.reservation.request.offeree.user
                      .username !== user.username &&
                    renamedIncident.reservation.request.offeror.user
                      .username !== user.username
                  )
                    throw new UnauthorizedException(
                      `You haven't opened the ${id} incident.`,
                    );

                  const { title } = renameIncidentDTO;

                  renamedIncident.title = title;

                  incidentsRepo = incidentsRepo.map((incident) => {
                    if (incident.id === id) return renamedIncident;

                    return incident;
                  });

                  return { id };
                },
              ),
            alterIncidentStatus: jest
              .fn()
              .mockImplementation(
                (
                  id: string,
                  alterIncidentStatusDTO: AlterIncidentStatusDTO,
                ): { id: string } => {
                  const alteredIncident: Incident = incidentsRepo.find(
                    (incident) => incident.id === id,
                  );

                  if (!alteredIncident)
                    throw new NotFoundException(
                      `The incident identified with ${id} wasn't found.`,
                    );

                  const { status, conclusion } = alterIncidentStatusDTO;

                  alteredIncident.status = status as IncidentStatus;

                  if (conclusion) alteredIncident.conclusion = conclusion;

                  incidentsRepo = incidentsRepo.map((incident) => {
                    if (incident.id === id) return alteredIncident;

                    return incident;
                  });

                  return { id };
                },
              ),
            closeIncident: jest
              .fn()
              .mockImplementation((user: User, id: string): { id: string } => {
                const incident: Incident = incidentsRepo.find(
                  (incident) => incident.id === id,
                );

                if (!incident)
                  throw new NotFoundException(
                    `The incident identified with ${id} wasn't found.`,
                  );

                if (
                  user.privilege !== 'SUPERUSER' &&
                  incident.openedBy.username !== user.username
                )
                  throw new UnauthorizedException(
                    `You haven't opened the ${id} incident.`,
                  );

                if (incident.status === 'PENDING')
                  throw new ConflictException(
                    `The incident ${id} is still pending.`,
                  );

                incidentsRepo = incidentsRepo.filter(
                  (incident) => incident.id !== id,
                );

                return { id };
              }),
          };
      })
      .compile();

    controller = module.get<IncidentsController>(IncidentsController);
  });

  describe('openIncident', () => {
    it('should return an object holding id property', () => {
      const openIncidentDTO: OpenIncidentDTO = {
        title: "Yet, i'm too old.",
        idReservation: mockReservationsRepo[0].id,
      };

      expect(
        controller.openIncident(
          mockReservationsRepo[0].request.offeree.user,
          openIncidentDTO,
        ),
      ).toMatchObject<{ id: string }>({ id: expect.any(String) });
    });

    it('should throw a NotFoundException', () => {
      const idReservation: string = uuidv4();

      const openIncidentDTO: OpenIncidentDTO = {
        title: "Yet, i'm too old.",
        idReservation,
      };

      expect(() =>
        controller.openIncident(
          mockReservationsRepo[0].request.offeree.user,
          openIncidentDTO,
        ),
      ).toThrow(
        `The reservation identified with ${idReservation} wasn't found.`,
      );
    });
  });

  describe('obtainIncidents', () => {
    it('should return an instance of Incident array', () => {
      const obtainIncidentsDTO: ObtainIncidentsDTO = {
        status: 'REJECTED',
      };

      expect(
        controller.obtainIncidents(
          mockReservationsRepo[0].request.offeree.user,
          mockReservationsRepo[0].id,
          obtainIncidentsDTO,
        ),
      ).toBeInstanceOf(Array<Incident>);
    });

    it('should throw an UnauthorizedException', () => {
      const obtainIncidentsDTO: ObtainIncidentsDTO = {
        status: 'REJECTED',
      };

      expect(() =>
        controller.obtainIncidents(
          mockReservationsRepo[0].request.offeree.user,
          mockReservationsRepo[1].id,
          obtainIncidentsDTO,
        ),
      ).toThrow(
        `Cannot obtain incidents due to not being a participant in the ${mockReservationsRepo[1].id} reservation.`,
      );
    });
  });

  describe('renameIncident', () => {
    it('should return an object holding id property', () => {
      const renameIncidentDTO: RenameIncidentDTO = {
        title: "Yet, i'm getting older",
      };

      expect(
        controller.renameIncident(
          incidentsRepo[0].reservation.request.offeree.user,
          incidentsRepo[0].id,
          renameIncidentDTO,
        ),
      ).toMatchObject<{ id: string }>({ id: incidentsRepo[0].id });
    });

    it('should throw an UnauthorizedException', () => {
      const renameIncidentDTO: RenameIncidentDTO = {
        title: "Yet, i'm getting older",
      };

      expect(() =>
        controller.renameIncident(
          incidentsRepo[0].reservation.request.offeree.user,
          incidentsRepo[1].id,
          renameIncidentDTO,
        ),
      ).toThrow(`You haven't opened the ${incidentsRepo[1].id} incident.`);
    });
  });

  describe('alterIncidentStatus', () => {
    it('should return an object holding id property', () => {
      const alterIncidentStatusDTO: AlterIncidentStatusDTO = {
        status: 'RESOLVED',
        conclusion: 'Mikey is indeed getting older.',
      };

      expect(
        controller.alterIncidentStatus(
          incidentsRepo[incidentsRepo.length - 1].id,
          alterIncidentStatusDTO,
        ),
      ).toMatchObject<{ id: string }>({
        id: incidentsRepo[incidentsRepo.length - 1].id,
      });
    });
  });

  describe('closeIncident', () => {
    it('should return an object holding id property', () => {
      const id: string = incidentsRepo[incidentsRepo.length - 1].id;

      expect(
        controller.closeIncident(
          incidentsRepo[incidentsRepo.length - 1].reservation.request.offeree
            .user,
          id,
        ),
      ).toMatchObject<{ id: string }>({
        id,
      });
    });

    it('should throw a UnauthorizedException', () => {
      expect(() =>
        controller.closeIncident(
          incidentsRepo[1].reservation.request.offeree.user,
          incidentsRepo[0].id,
        ),
      ).toThrow(`You haven't opened the ${incidentsRepo[0].id} incident.`);
    });
  });
});
