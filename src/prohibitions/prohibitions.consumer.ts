import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import Prohibition from './entities/prohibition.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { DataLoggerService } from 'src/data-logger/data-logger.service';

@Processor('prohibitions')
export class ProhibitionsConsumer {
  constructor(
    @InjectRepository(Prohibition)
    private prohibitionsRepo: Repository<Prohibition>,
    private dataLoggerService: DataLoggerService,
  ) {}

  @Process()
  async terminateProhibition(job: Job): Promise<void> {
    let prohibition: Prohibition;

    try {
      prohibition = await this.prohibitionsRepo.findOne({
        where: { incident: { id: job.data.idIncident } },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during data fetch: ${error.message}`,
      );
    }

    try {
      this.prohibitionsRepo.delete(prohibition.id);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during data deletion: ${error.message}`,
      );
    }
  }
}
