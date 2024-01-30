import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import BaseService from 'src/base.service';
import Incident from './incident.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import User from 'src/auth/user.entity';
import OpenIncidentDTO from './dto/open-incident.dto';
import { ReservationsService } from 'src/reservations/reservations.service';
import Reservation from 'src/reservations/reservation.entity';
import ObtainIncidentsDTO from './dto/obtain-incidents.dto';
import RenameIncidentDTO from './dto/rename-incident.dto';
import AlterIncidentStatusDTO from './dto/alter-incident-status.dto';
import IncidentStatus from './types/incident-status';

@Injectable()
export class IncidentsService extends BaseService<Incident> {
  constructor(
    @InjectRepository(Incident)
    private incidentsRepo: Repository<Incident>,
    @Inject(forwardRef(() => ReservationsService))
    private reservationsService: ReservationsService,
  ) {
    super(incidentsRepo);
  }

  async openIncident(
    user: User,
    openIncidentDTO: OpenIncidentDTO,
  ): Promise<{ id: string }> {
    const { idReservation, title } = openIncidentDTO;

    const reservation: Reservation = await this.reservationsService.obtainOneBy(
      {
        id: idReservation,
      },
    );

    if (
      reservation.request.offeree.user.username !== user.username &&
      reservation.request.offeror.user.username !== user.username
    )
      throw new UnauthorizedException(
        `Cannot open an incident due to not being a participant in the ${idReservation} reservation.`,
      );

    const incident: Incident = this.repo.create({
      reservation,
      title,
      openedBy: user,
    });

    try {
      await this.repo.insert(incident);
    } catch (error) {
      this.dataLoggerService.error(
        `Error during Incident record insertion: ${error.message}`,
      );

      throw new InternalServerErrorException(
        `Error during data insert: ${error.message}`,
      );
    }

    this.dataLoggerService.create(incident.constructor.name, incident.id);

    return { id: incident.id };
  }

  async obtainIncidents(
    user: User,
    idReservation: string,
    obtainIncidentsDTO: ObtainIncidentsDTO,
  ): Promise<Incident[]> {
    const reservation: Reservation = await this.reservationsService.obtainOneBy(
      { id: idReservation },
    );

    if (
      reservation.request.offeree.user.username !== user.username &&
      reservation.request.offeror.user.username !== user.username
    )
      throw new UnauthorizedException(
        `Cannot obtain incidents due to not being a participant in the ${idReservation} reservation.`,
      );

    const { status } = obtainIncidentsDTO;

    const query: SelectQueryBuilder<Incident> =
      this.repo.createQueryBuilder('incident');

    query.where('"idReservation" = :idReservation', { idReservation });

    if (status) query.andWhere('status = :status', { status });

    let incidents: Incident[];

    try {
      incidents = await query.getMany();
    } catch (error) {
      this.dataLoggerService.error(
        `Error during Incident records fetch: ${error.message}`,
      );

      throw new InternalServerErrorException(
        `Error during data fetch: ${error.message}`,
      );
    }

    return incidents;
  }

  async renameIncident(
    user: User,
    id: string,
    renameIncidentDTO: RenameIncidentDTO,
  ): Promise<{ id: string }> {
    const { title } = renameIncidentDTO;

    const incident = await this.obtainOneBy({ id });

    if (incident.openedBy.username !== user.username)
      throw new UnauthorizedException(`You haven't opened the ${id} incident.`);

    try {
      await this.repo.update({ id }, { title });
    } catch (error) {
      this.dataLoggerService.error(
        `Error during Incident record update: ${error.message}`,
      );

      throw new InternalServerErrorException(
        `Error during data update: ${error.message}`,
      );
    }

    this.dataLoggerService.update(
      'Incident',
      incident.id,
      `title: ${incident.title} = title: ${title}`,
    );

    return { id };
  }

  async alterIncidentStatus(
    id: string,
    alterIncidentStatusDTO: AlterIncidentStatusDTO,
  ): Promise<{ id: string }> {
    const incident: Incident = await this.obtainOneBy({ id });

    const status: IncidentStatus =
      alterIncidentStatusDTO.status as IncidentStatus;

    try {
      await this.repo.update(id, { status });
    } catch (error) {
      this.dataLoggerService.error(
        `Error during Incident record update: ${error.message}`,
      );

      throw new InternalServerErrorException(
        `Error during data update: ${error.message}`,
      );
    }

    this.dataLoggerService.update(
      incident.constructor.name,
      incident.id,
      `status: ${incident.status} = status: ${status}`,
    );

    return { id };
  }

  async closeIncident(user: User, id: string): Promise<{ id: string }> {
    const incident: Incident = await this.obtainOneBy({ id });

    if (
      user.privilege !== 'SUPERUSER' &&
      incident.openedBy.username !== user.username
    )
      throw new UnauthorizedException(`You haven't opened the ${id} incident.`);

    if (incident.status === 'PENDING')
      throw new ConflictException(`The incident ${id} is still pending.`);

    try {
      await this.repo.delete(id);
    } catch (error) {
      this.dataLoggerService.error(
        `Error during Incident record deletion: ${error.message}`,
      );

      throw new InternalServerErrorException(
        `Error during data deletion: ${error.message}`,
      );
    }

    this.dataLoggerService.delete(incident.constructor.name, id);

    return { id };
  }
}
