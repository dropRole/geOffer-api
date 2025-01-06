import { User } from './auth/entities/user.entity';
import Complaint from './complaints/entities/complaint.entity';
import { DataLoggerService } from './data-logger/data-logger.service';
import { Incident } from './incidents/entities/incident.entity';
import Offeree from './offerees/entities/offeree.entity';
import { Offeror } from './offerors/entities/offeror.entity';
import Prohibition from './prohibitions/entities/prohibition.entity';
import Request from './requests/entities/request.entity';
import Reservation from './reservations/entities/reservation.entity';
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
      this.dataLoggerService.error(
        `Error during record fetch: ${error.message}`,
      );

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

    return record;
  }

  async obtainManyBy(clause: FindOptionsWhere<T>): Promise<T[]> {
    let records: T[];

    try {
      records = await this.repo.findBy(clause);
    } catch (error) {
      this.dataLoggerService.error(
        `Error during records fetch: ${error.message}`,
      );

      throw new InternalServerErrorException(
        `Error during data fetch: ${error.message}`,
      );
    }

    if (!records)
      throw new NotFoundException(
        `${this.repo.metadata.name} records queried via ${JSON.stringify(
          clause,
        )} were not found.`,
      );

    return records;
  }
}
