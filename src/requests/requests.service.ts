import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Request from './entities/request.entity';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import BaseService from '../base.service';
import { User } from '../auth/entities/user.entity';
import MakeRequestDTO from './dto/make-request.dto';
import { OfferorsService } from 'src/offerors/offerors.service';
import ObtainRequestsDTO from './dto/obtain-requests.dto';
import AmendRequestProvisionsDTO from './dto/amend-request-provisions.dto';
import AssessReservationTimeDTO from './dto/assess-reservation-time.dto';
import { ReservationsService } from '../reservations/reservations.service';
import Offeree from '../offerees/entities/offeree.entity';
import { OffereesService } from 'src/offerees/offerees.service';
import Reservation from '../reservations/entities/reservation.entity';
import ServiceToRequest from './entities/service-to-request.entity';
import ServiceToOfferor from '../offerors/entities/service-to-offeror.entity';

@Injectable()
export class RequestsService extends BaseService<Request> {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Request)
    requestsRepo: Repository<Request>,
    @InjectRepository(ServiceToRequest)
    private requestServicesRepo: Repository<ServiceToRequest>,
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
    const { note, requestedFor, idOfferorService, amount } = makeRequestDTO;

    const offeree: Offeree = await this.offereesService.obtainOneBy({
      user: { username: user.username },
    });

    const request: Request = this.repo.create({
      note,
      requestedFor,
      offeree,
    });

    let offerorService: ServiceToOfferor;

    try {
      offerorService =
        await this.offerorsService.obtainOfferorService(idOfferorService);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during fetching the offeror's service identified with ${idOfferorService}: ${error.message}.`,
      );
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    const requestedService: ServiceToRequest = this.requestServicesRepo.create({
      request,
      amount,
      serviceToOfferor: offerorService,
    });

    request.services = [requestedService];

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const requestInsertResult = await queryRunner.manager.insert(
        Request,
        request,
      );

      await queryRunner.manager.insert(ServiceToRequest, {
        ...requestedService,
        request: { ...request, id: requestInsertResult.identifiers[0].id },
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw new InternalServerErrorException(
        `Error during the request and belonging services insertion: ${error.message}.`,
      );
    } finally {
      await queryRunner.release();
    }

    this.dataLoggerService.create(request.constructor.name, request.id);
    this.dataLoggerService.create(
      requestedService.constructor.name,
      requestedService.id,
    );

    return { id: request.id };
  }

  async obtainRequests(
    user: User,
    obtainRequestsDTO: ObtainRequestsDTO,
  ): Promise<{ requests: Request[]; count: number }> {
    const { requestedOrder, take } = obtainRequestsDTO;

    let records: [Request[], number];

    try {
      records = await this.repo.findAndCount(
        user.privilege === 'OFFEREE'
          ? {
              where: {
                offeree: { user: { username: user.username } },
              },
              order: { requestedAt: requestedOrder },
              take,
            }
          : user.privilege === 'OFFEROR' && {
              where: {
                services: {
                  serviceToOfferor: {
                    offeror: { user: { username: user.username } },
                  },
                },
              },
              order: { requestedAt: requestedOrder },
              take,
            },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during fetching the requests: ${error.message}.`,
      );
    }

    return { requests: records[0], count: records[1] };
  }

  async amendRequestProvisions(
    id: string,
    amendRequestProvisionsDTO: AmendRequestProvisionsDTO,
  ): Promise<{ id: string }> {
    const { note } = amendRequestProvisionsDTO;

    const request: Request = await this.obtainOneBy({ id });

    try {
      await this.repo.update({ id }, { note });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the request note update: ${error.message}.`,
      );
    }

    this.dataLoggerService.update(
      request.constructor.name,
      request.id,
      `note: ${request.note} => note: ${note}`,
    );

    return { id: request.id };
  }

  async assessReservationTime(
    id: string,
    assessReservationTimeDTO: AssessReservationTimeDTO,
  ): Promise<{ id: string }> {
    const { assessment } = assessReservationTimeDTO;

    const request: Request = await this.obtainOneBy({ id });

    try {
      await this.repo.update({ id }, { assessment });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the request assessment update: ${error.message}.`,
      );
    }

    this.dataLoggerService.update(
      request.constructor.name,
      request.id,
      `assessment: ${request.assessment} => assessment: ${assessment}`,
    );

    return { id: request.id };
  }

  async revokeRequest(id: string): Promise<{ id: string }> {
    const request: Request = await this.obtainOneBy({ id });

    let reserved: Reservation;

    try {
      reserved = await this.reservationsService.obtainOneBy({
        request: { id },
      });
    } catch (error) {
      if (error.statusCode === 500)
        throw new InternalServerErrorException(error.message);

      try {
        await this.reservationsService.obtainOneBy({
          request,
        });
      } catch (error) {
        try {
          await this.requestServicesRepo.delete({ request: { id } });

          await this.repo.delete(id);

          this.dataLoggerService.delete(request.constructor.name, id);

          return { id: request.id };
        } catch (error) {
          throw new InternalServerErrorException(
            `Error during the request deletion: ${error.message}.`,
          );
        }
      }
    }

    if (reserved)
      throw new ConflictException(
        `Cannot delete ${id} request due to already reserved.`,
      );
  }

  async revokeRequestsForService(idOfferorService: string): Promise<void> {
    try {
      await this.requestServicesRepo.delete({
        serviceToOfferor: { id: idOfferorService },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the requests services deletion: ${error.message}.`,
      );
    }
  }
}
