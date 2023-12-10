import User from './auth/user.entity';
import Complaint from './complaints/complaint.entity';
import { DataLoggerService } from './data-logger/data-logger.service';
import Incident from './incidents/incident.entity';
import Offeree from './offerees/offeree.entity';
import Offeror from './offerors/offeror.entity';
import Prohibition from './prohibitions/prohibition.entity';
import Request from './requests/request.entity';
import Reservation from './reservations/reservation.entity';
import { Repository, FindOptionsWhere } from 'typeorm';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

type Entity =
  | User
  | Offeree
  | Offeror
  | Request
  | Reservation
  | Incident
  | Complaint
  | Prohibition;

export default abstract class BaseService<T extends Entity> {
  protected readonly repo: Repository<T>;
  protected readonly dataLoggerService: DataLoggerService;

  constructor(entityRepo: Repository<T>) {
    this.repo = entityRepo;

    this.dataLoggerService = new DataLoggerService();
  }

  async obtainOneBy(clause: FindOptionsWhere<T>): Promise<T> {
    let record: T;

    try {
      record = await this.repo.findOneBy(clause);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during data fetch: ${error.message}`,
      );
    }

    if (!record)
      throw new NotFoundException(
        `${this.repo.metadata.name} record queried via ${JSON.stringify(
          clause,
        )} was not found.`,
      );

    this.dataLoggerService.read(record.constructor.name, 1);

    return record;
  }
}
