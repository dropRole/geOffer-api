import { Injectable } from '@nestjs/common';
import BaseService from 'src/base.service';
import Incident from './incident.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class IncidentsService extends BaseService<Incident> {
  constructor(
    @InjectRepository(Incident)
    private incidentsRepo: Repository<Incident>,
  ) {
    super(incidentsRepo);
  }
}
