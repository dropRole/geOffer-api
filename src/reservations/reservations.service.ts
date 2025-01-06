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
      part.value.match(/,|\/|:| /g) === null ? (code += part.value) : undefined,
    );

    code += `_${
      request.offeree.user.username.substring(0, 1) +
      request.offeree.user.username.substring(
        request.offeree.user.username.length,
        request.offeree.user.username.length - 1,
      )
    }`;

    const reservation: Reservation = this.repo.create({ request, code });

    try {
      await this.repo.insert(reservation);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the reservation insertion: ${error.message}`,
      );
    }

    this.dataLoggerService.create(reservation.constructor.name, reservation.id);

    return { id: reservation.id };
  }

  async obtainReservations(
    user: User,
    obtainReservationsDTO: ObtainReservationsDTO,
  ): Promise<Reservation[]> {
    const { idOfferee, idOfferor, reservationPeriod, reservedOrder, take } =
      obtainReservationsDTO;

    const query: SelectQueryBuilder<Reservation> =
      this.repo.createQueryBuilder('reservation');
    query.leftJoinAndSelect('reservation.incidents', 'incident');
    query.leftJoinAndSelect('incident.complaints', 'complaint');
    query.innerJoinAndSelect('reservation.request', 'request');
    query.innerJoin('request.offeree', 'offeree');
    query.innerJoin('offeree.user', 'offereeUser');
    query.innerJoin('request.offeror', 'offeror');
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

    let reservations: Reservation[] = [];

    try {
      reservations = await query.getMany();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during fetching the reservations: ${error.message}`,
      );
    }

    return reservations;
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
          `Error during the reservation deletion: ${error.message}`,
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
