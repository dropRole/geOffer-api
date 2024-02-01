import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Request from './request.entity';
import { Repository } from 'typeorm';
import BaseService from '../base.service';
import User from '../auth/user.entity';
import MakeRequestDTO from './dto/make-request.dto';
import { OfferorsService } from '../offerors/offerors.service';
import Offeror from '../offerors/offeror.entity';
import ObtainRequestsDTO from './dto/obtain-requests.dto';
import AmendRequestProvisionsDTO from './dto/amend-request-provisions.dto';
import AssessReservationTimeDTO from './dto/assess-reservation-time.dto';
import { ReservationsService } from '../reservations/reservations.service';
import Offeree from '../offerees/offeree.entity';
import { OffereesService } from '../offerees/offerees.service';
import Reservation from '../reservations/reservation.entity';

@Injectable()
export class RequestsService extends BaseService<Request> {
  constructor(
    @InjectRepository(Request)
    requestsRepo: Repository<Request>,
    @Inject(forwardRef(() => OffereesService))
    private offereesService: OffereesService,
    @Inject(forwardRef(() => OfferorsService))
    private offerorsService: OfferorsService,
    @Inject(forwardRef(() => ReservationsService))
    private reservationsService: ReservationsService,
  ) {
    super(requestsRepo);
  }

  async makeRequest(
    user: User,
    makeRequestDTO: MakeRequestDTO,
  ): Promise<{ id: string }> {
    const { seats, cause, note, requestedFor, idOfferor } = makeRequestDTO;

    const offeror: Offeror = await this.offerorsService.obtainOneBy({
      id: idOfferor,
    });

    const offeree: Offeree = await this.offereesService.obtainOneBy({
      user: { username: user.username },
    });

    const request: Request = this.repo.create({
      seats,
      cause,
      note,
      requestedFor,
      offeror,
      offeree,
    });

    try {
      await this.repo.insert(request);
    } catch (error) {
      this.dataLoggerService.error(
        `Error during Request record insertion: ${error.message}`,
      );

      throw new InternalServerErrorException(
        `Error during data insert: ${error.message}`,
      );
    }

    this.dataLoggerService.create(request.constructor.name, request.id);

    return { id: request.id };
  }

  async obtainRequests(
    user: User,
    obtainRequestsDTO: ObtainRequestsDTO,
  ): Promise<Request[]> {
    const { requestedOrder, take } = obtainRequestsDTO;

    let requests: Request[];

    try {
      requests = await this.repo.find(
        user.privilege === 'OFFEREE'
          ? {
              where: {
                offeree: { user: { username: user.username } },
              },
              order: { requestedAt: requestedOrder },
              take,
            }
          : user.privilege === 'OFFEROR' && {
              where: { offeror: { user: { username: user.username } } },
              order: { requestedAt: requestedOrder },
              take,
            },
      );
    } catch (error) {
      this.dataLoggerService.error(
        `Error during Request records fetch: ${error.message}`,
      );

      throw new InternalServerErrorException(
        `Error during data fetch: ${error.message}`,
      );
    }

    return requests;
  }

  async amendRequestProvisions(
    user: User,
    id: string,
    amendRequestProvisionsDTO: AmendRequestProvisionsDTO,
  ): Promise<{ id: string }> {
    const { seats, cause, note } = amendRequestProvisionsDTO;

    const request: Request = await this.obtainOneBy({ id });

    if (request.offeree.user.username !== user.username)
      throw new UnauthorizedException(`You haven't made the ${id} request.`);

    try {
      await this.repo.update({ id }, { seats, cause, note });
    } catch (error) {
      this.dataLoggerService.error(
        `Error during Request record update: ${error.message}`,
      );

      throw new InternalServerErrorException(
        `Error during data update: ${error.message}`,
      );
    }

    this.dataLoggerService.update(
      request.constructor.name,
      request.id,
      `{ seats: ${request.seats}, cause: ${request.cause}, note: ${request.note} } => { seats: ${seats}, cause: ${cause}, note: ${note} }`,
    );

    return { id: request.id };
  }

  async assessReservationTime(
    user: User,
    id: string,
    assessReservationTimeDTO: AssessReservationTimeDTO,
  ): Promise<{ id: string }> {
    const { assessment } = assessReservationTimeDTO;

    const request: Request = await this.obtainOneBy({ id });

    if (request.offeror.user.username !== user.username)
      throw new UnauthorizedException(`Request ${id} wasn't intended for you.`);

    try {
      await this.repo.update({ id }, { assessment });
    } catch (error) {
      this.dataLoggerService.error(
        `Error during Request record update: ${error.message}`,
      );

      throw new InternalServerErrorException(
        `Error during data update: ${error.message}`,
      );
    }

    this.dataLoggerService.update(
      request.constructor.name,
      request.id,
      `{ assessment: ${request.assessment} } => { assessment: ${assessment} }`,
    );

    return { id: request.id };
  }

  async revokeRequest(user: User, id: string): Promise<{ id: string }> {
    const request: Request = await this.obtainOneBy({ id });

    if (request.offeree.user.username !== user.username)
      throw new UnauthorizedException(`You haven't made the ${id} request.`);

    let reserved: Reservation;

    try {
      reserved = await this.reservationsService.obtainOneBy({
        request: { id },
      });
    } catch (error) {
      if (error.statusCode === 500) {
        this.dataLoggerService.error(
          `Error during Reservation record fetch: ${error.message}`,
        );

        throw new InternalServerErrorException(error.message);
      }

      try {
        await this.reservationsService.obtainOneBy({
          request,
        });
      } catch (error) {
        try {
          await this.repo.delete(id);

          this.dataLoggerService.delete(request.constructor.name, id);

          return { id: request.id };
        } catch (error) {
          this.dataLoggerService.error(
            `Error during Request record deletion: ${error.message}`,
          );

          throw new InternalServerErrorException(
            `Error during data deletion: ${error.message}`,
          );
        }
      }
    }

    if (reserved)
      throw new ConflictException(
        `Cannot delete ${id} request due to already reserved.`,
      );
  }
}
