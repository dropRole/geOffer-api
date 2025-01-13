import {
  Injectable,
  Inject,
  forwardRef,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import BaseService from 'src/base.service';
import Reservation from './entities/reservation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import MakeReservationDTO from './dto/make-reservation.dto';
import { RequestsService } from 'src/requests/requests.service';
import Request from '../requests/entities/request.entity';
import ObtainReservationsDTO from './dto/obtain-reservations.dto';
import { IncidentsService } from 'src/incidents/incidents.service';
import { Incident } from '../incidents/entities/incident.entity';
import * as moment from 'moment';

@Injectable()
export class ReservationsService extends BaseService<Reservation> {
  constructor(
    @InjectRepository(Reservation)
    reservationsRepo: Repository<Reservation>,
    @Inject(forwardRef(() => RequestsService))
    private requestsService: RequestsService,
    @Inject(forwardRef(() => IncidentsService))
    private incidentsService: IncidentsService,
  ) {
    super(reservationsRepo);
  }

  async makeReservation(
    makeReservationDTO: MakeReservationDTO,
  ): Promise<{ id: string }> {
    const { idRequest } = makeReservationDTO;

    const request: Request = await this.requestsService.obtainOneBy({
      id: idRequest,
    });

    const reserved: boolean = await this.repo.exist({
      where: { request: { id: idRequest } },
    });

    if (reserved)
      throw new ConflictException(`Request ${request.id} has been reserved.`);

    let code = '';

    const todaysDate = moment(new Date());

    const requestantUser = request.offeree.user.username;

    code = todaysDate.format('DDMMYYHHmmss');
    code += `_${
      requestantUser.substring(0, 1) +
      requestantUser.substring(requestantUser.length, requestantUser.length - 1)
    }`;

    const reservation: Reservation = this.repo.create({ request, code });

    try {
      await this.repo.insert(reservation);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the reservation insertion: ${error.message}.`,
      );
    }

    this.dataLoggerService.create(reservation.constructor.name, reservation.id);

    return { id: reservation.id };
  }

  async obtainReservations(
    user: User,
    obtainReservationsDTO: ObtainReservationsDTO,
  ): Promise<{ reservations: Reservation[]; count: number }> {
    const { idOfferee, idOfferor, reservationPeriod, reservedOrder, take } =
      obtainReservationsDTO;

    const query: SelectQueryBuilder<Reservation> =
      this.repo.createQueryBuilder('reservation');
    query.leftJoinAndSelect('reservation.incidents', 'incident');
    query.leftJoinAndSelect('incident.complaints', 'complaint');
    query.innerJoinAndSelect('reservation.request', 'request');
    query.innerJoin('request.offeree', 'offeree');
    query.innerJoin('offeree.user', 'offereeUser');
    query.innerJoin('request.services', 'requestedService');
    query.innerJoin('requestedService.serviceToOfferor', 'offerorService');
    query.innerJoin('offerorService.offeror', 'offeror');
    query.innerJoin('offeror.user', 'offerorUser');

    switch (user.privilege) {
      case 'SUPERUSER':
        if (idOfferee) query.where('offeree.id = :idOfferee', { idOfferee });

        if (idOfferor) query.where('offeror.id = :idOfferor', { idOfferor });
        break;
      case 'OFFEREE':
        query.where('"offereeUser".username = :username', {
          username: user.username,
        });
        break;
      case 'OFFEROR':
        query.where('"offerorUser".username = :username', {
          username: user.username,
        });
        break;
    }

    switch (reservationPeriod) {
      case 'TODAY':
        query.andWhere('reservation.reserved::DATE = NOW()::DATE');
        break;
      case 'WEEK':
        query.andWhere(
          "DATE_PART('week', reservation.reserved) = DATE_PART('week', NOW()) AND DATE_PART('year', reservation.reserved) = DATE_PART('year', NOW())",
        );
        break;
      case 'MONTH':
        query.andWhere(
          "DATE_PART('month', reservation.reserved) = DATE_PART('month', NOW()) AND DATE_PART('year', reservation.reserved) = DATE_PART('year', NOW())",
        );
        break;
    }

    query.orderBy('reservation.reserved', reservedOrder);

    query.take(take);

    let records: [Reservation[], number];

    try {
      records = await query.getManyAndCount();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during fetching the reservations: ${error.message}.`,
      );
    }

    return { reservations: records[0], count: records[1] };
  }

  async withdrawReservation(id: string): Promise<{ id: string }> {
    const reservation: Reservation = await this.obtainOneBy({
      id,
    });

    let incident: Incident;

    try {
      incident = await this.incidentsService.obtainOneBy({
        reservation: { id },
        status: 'PENDING',
      });
    } catch (error) {
      if (error.statusCode === 500)
        throw new InternalServerErrorException(error.massage);

      try {
        await this.repo.delete(id);
      } catch (error) {
        throw new InternalServerErrorException(
          `Error during the reservation deletion: ${error.message}.`,
        );
      }

      this.dataLoggerService.delete('Reservation', id);

      return { id: reservation.id };
    }

    if (incident)
      throw new ConflictException(
        `There're pending incidents on the reservation.`,
      );
  }
}
