import {
  Injectable,
  Inject,
  forwardRef,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import BaseService from 'src/base.service';
import Reservation from './reservation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import User from 'src/auth/user.entity';
import MakeReservationDTO from './dto/make-reservation.dto';
import { RequestsService } from 'src/requests/requests.service';
import Request from 'src/requests/request.entity';
import ObtainReservationsDTO from './dto/obtain-reservations.dto';
import { IncidentsService } from 'src/incidents/incidents.service';
import Incident from 'src/incidents/incident.entity';

@Injectable()
export class ReservationsService extends BaseService<Reservation> {
  constructor(
    @InjectRepository(Reservation)
    reservationsRepo: Repository<Reservation>,
    @Inject(forwardRef(() => RequestsService))
    private requestsService: RequestsService,
    private incidentsService: IncidentsService,
  ) {
    super(reservationsRepo);
  }

  async makeReservation(
    user: User,
    makeReservationDTO: MakeReservationDTO,
  ): Promise<{ id: string }> {
    const { idRequest } = makeReservationDTO;

    const request: Request = await this.requestsService.obtainOneBy({
      id: idRequest,
    });

    const reserved: boolean = await this.repo.exist({
      where: { request: { id: idRequest } },
    });

    if (request.offeror.user.username !== user.username)
      throw new UnauthorizedException(
        `Request ${request.id} wasn't intended for you.`,
      );

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
        `Error during data insert: ${error.message}`,
      );
    }

    this.dataLoggerService.create(reservation.constructor.name, reservation.id);

    return { id: reservation.id };
  }

  async obtainReservations(
    user: User,
    obtainReservationsDTO: ObtainReservationsDTO,
  ): Promise<Reservation[]> {
    const { idOfferee, idOfferor, reservedOrder, take } = obtainReservationsDTO;

    let reservations: Reservation[] = [];

    try {
      switch (user.privilege) {
        case 'SUPERUSER':
          reservations = await this.repo.find({
            where: idOfferee
              ? { request: { offeree: { id: idOfferee } } }
              : idOfferor
                ? { request: { offeror: { id: idOfferor } } }
                : null,
            order: { reserved: reservedOrder },
            take,
          });
          break;
        case 'OFFEREE':
          reservations = await this.repo.find({
            where: {
              request: { offeree: { user: { username: user.username } } },
            },
            order: { reserved: reservedOrder },
            take,
          });
          break;
        case 'OFFEROR':
          reservations = await this.repo.find({
            where: {
              request: { offeror: { user: { username: user.username } } },
            },
            order: { reserved: reservedOrder },
            take,
          });
          break;
      }
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during data fetch: ${error.message}`,
      );
    }
    this.dataLoggerService.read('Reservation', reservations.length);

    return reservations;
  }

  async withdrawReservation(user: User, id: string): Promise<{ id: string }> {
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

      if (reservation.request.offeror.user.username !== user.username)
        throw new UnauthorizedException(
          `You haven't made the ${id} reservation.`,
        );

      try {
        await this.repo.delete(id);
      } catch (error) {
        throw new InternalServerErrorException(
          `Error during data deletion: ${error.message}`,
        );
      }

      this.dataLoggerService.delete('Reservation', 1);

      return { id: reservation.id };
    }

    if (incident)
      throw new ConflictException(
        `There're pending incidents on the reservation.`,
      );
  }
}
