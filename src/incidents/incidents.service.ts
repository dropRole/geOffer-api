import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  forwardRef,
} from '@nestjs/common';
import BaseService from 'src/common/services/base.service';
import { Incident } from './entities/incident.entity';
import type { IncidentStatus } from './entities/incident.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import OpenIncidentDTO from './dto/open-incident.dto';
import { ReservationsService } from 'src/reservations/reservations.service';
import Reservation from '../reservations/entities/reservation.entity';
import ObtainIncidentsDTO from './dto/obtain-incidents.dto';
import RenameIncidentDTO from './dto/rename-incident.dto';
import AlterIncidentStatusDTO from './dto/alter-incident-status.dto';

@Injectable()
export class IncidentsService extends BaseService<Incident> {
  constructor(
    @InjectRepository(Incident)
    incidentsRepo: Repository<Incident>,
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

    const incident: Incident = this.repo.create({
      reservation,
      title,
      openedBy: user,
    });

    try {
      await this.repo.insert(incident);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the incident insertion: ${error.message}.`,
      );
    }

    this.dataLoggerService.create(incident.constructor.name, incident.id);

    return { id: incident.id };
  }

  async obtainIncidents(
    idReservation: string,
    obtainIncidentsDTO: ObtainIncidentsDTO,
  ): Promise<{ incidents: Incident[]; count: number }> {
    const { status } = obtainIncidentsDTO;

    const query: SelectQueryBuilder<Incident> =
      this.repo.createQueryBuilder('incident');

    query.where('"idReservation" = :idReservation', { idReservation });

    if (status) query.andWhere('status = :status', { status });

    let records: [Incident[], number];

    let incidents: Incident[];

    try {
      records = await query.getManyAndCount();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during fetching the incidents: ${error.message}.`,
      );
    }

    return { incidents: records[0], count: records[1] };
  }

  async renameIncident(
    id: string,
    renameIncidentDTO: RenameIncidentDTO,
  ): Promise<{ id: string }> {
    const { title } = renameIncidentDTO;

    const incident = await this.obtainOneBy({ id });

    try {
      await this.repo.update({ id }, { title });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during renaming the incident: ${error.message}.`,
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
      throw new InternalServerErrorException(
        `Error during the incident status update: ${error.message}.`,
      );
    }

    this.dataLoggerService.update(
      incident.constructor.name,
      incident.id,
      `status: ${incident.status} = status: ${status}`,
    );

    return { id };
  }

  async closeIncident(id: string): Promise<{ id: string }> {
    const incident: Incident = await this.obtainOneBy({ id });

    if (incident.status === 'PENDING')
      throw new ConflictException(`The incident ${id} is still pending.`);

    try {
      await this.repo.delete(id);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during closing the incident: ${error.message}`,
      );
    }

    this.dataLoggerService.delete(incident.constructor.name, id);

    return { id };
  }
}
