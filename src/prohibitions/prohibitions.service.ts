import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import BaseService from 'src/base.service';
import Prohibition from './entities/prohibition.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import DeclareProhibitionDTO from './dto/declare-prohibition.dto';
import { IncidentsService } from 'src/incidents/incidents.service';
import { Incident } from '../incidents/entities/incident.entity';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { User } from '../auth/entities/user.entity';
import ObtainProhibitionsDTO from './dto/obtain-prohibitions.dto';
import AlterTimeframeDTO from './dto/alter-timeframe.dto';

@Injectable()
export class ProhibitionsService extends BaseService<Prohibition> {
  constructor(
    @InjectRepository(Prohibition)
    prohibitionsRepo: Repository<Prohibition>,
    @InjectQueue('prohibitions')
    private prohibitionsQueue: Queue,
    private incidentsService: IncidentsService,
  ) {
    super(prohibitionsRepo);
  }

  async addProhibitionJob(
    idIncident: string,
    beginning: string,
    termination: string,
  ): Promise<void> {
    const delay: number =
      new Date(termination).getTime() - new Date(beginning).getTime();

    try {
      await this.prohibitionsQueue.add(
        { idIncident },
        {
          delay,
          removeOnComplete: true,
        },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the prohibition job addition: ${error.message}.`,
      );
    }
  }

  async removeProhibitionJob(prohibition: Prohibition): Promise<void> {
    try {
      const jobs: Job[] = await this.prohibitionsQueue.getDelayed();

      const alteredJob: Job = jobs.find(
        (job) => job.data.idIncident === prohibition.incident.id,
      );

      await alteredJob.remove();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the prohibition job removal: ${error.message}.`,
      );
    }
  }

  async declareProhibition(
    declareProhibitionDTO: DeclareProhibitionDTO,
  ): Promise<{ id: string }> {
    const { idIncident, beginning, termination } = declareProhibitionDTO;

    const incident: Incident = await this.incidentsService.obtainOneBy({
      id: idIncident,
    });

    const prohibited: boolean = await this.repo.exist({
      where: { incident: { id: idIncident } },
    });

    if (prohibited)
      throw new ConflictException(
        `The prohibition for the incident ${idIncident} was declared.`,
      );

    const prohibition: Prohibition = this.repo.create({
      incident,
      beginning,
      termination,
    });

    await this.addProhibitionJob(
      idIncident,
      prohibition.beginning,
      prohibition.termination,
    );

    try {
      await this.repo.insert(prohibition);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the prohibition insertion: ${error.message}.`,
      );
    }

    this.dataLoggerService.create(prohibition.constructor.name, prohibition.id);

    return { id: prohibition.id };
  }

  async obtainProhibitions(
    user: User,
    obtainProhibitionsDTO: ObtainProhibitionsDTO,
  ): Promise<{ prohibitions: Prohibition[]; count: number }> {
    const { idOfferee, idOfferor, prohibitedOrder, take } =
      obtainProhibitionsDTO;

    const query: SelectQueryBuilder<Prohibition> =
      this.repo.createQueryBuilder('prohibition');
    query.innerJoinAndSelect('prohibition.incident', 'incident');
    query.innerJoin('incident.reservation', 'reservation');
    query.innerJoin('reservation.request', 'request');

    switch (user.privilege) {
      case 'SUPERUSER':
        if (idOfferee) {
          query.innerJoinAndSelect('request.offeree', 'offeree');

          query.where('offeree.id = :idOfferee', { idOfferee });
        }

        if (idOfferor) {
          query.innerJoinAndSelect('request.offeror', 'offeror');

          query.where('offeror.id = :idOfferor', { idOfferor });
        }
        break;
      case 'OFFEREE':
        query.innerJoinAndSelect('request.offeree', 'offeree');
        query.innerJoinAndSelect('offeree.user', 'user');

        query.where('user.username = :username', { username: user.username });
        break;
      case 'OFFEROR':
        query.innerJoinAndSelect('request.offeror', 'offeror');
        query.innerJoinAndSelect('offeror.user', 'user');

        query.where('user.username = :username', { username: user.username });
        break;
    }

    query.orderBy('prohibition.beginning', prohibitedOrder);

    query.take(take);

    let records: [Prohibition[], number];

    try {
      records = await query.getManyAndCount();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during fetching the prohibitions: ${error.message}`,
      );
    }

    return { prohibitions: records[0], count: records[1] };
  }

  async alterTimeframe(
    id: string,
    alterTimeframeDTO: AlterTimeframeDTO,
  ): Promise<{ id: string }> {
    const { termination } = alterTimeframeDTO;

    const prohibition: Prohibition = await this.obtainOneBy({
      id,
    });

    await this.removeProhibitionJob(prohibition);

    await this.addProhibitionJob(
      prohibition.incident.id,
      new Date().toISOString(),
      new Date(termination).toISOString(),
    );

    try {
      await this.repo.update(id, { termination });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the prohibition timeframe update: ${error.message}.`,
      );
    }

    this.dataLoggerService.update(
      prohibition.constructor.name,
      prohibition.id,
      `termination: ${prohibition.termination} = termination: ${termination}`,
    );

    return { id };
  }

  async disdeclareProhibition(id: string): Promise<{ id: string }> {
    const prohibition: Prohibition = await this.obtainOneBy({
      id,
    });

    await this.removeProhibitionJob(prohibition);

    try {
      await this.repo.delete(id);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the prohibition deletion: ${error.message}.`,
      );
    }

    this.dataLoggerService.delete(prohibition.constructor.name, id);

    return { id };
  }
}
