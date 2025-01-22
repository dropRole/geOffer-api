import { Injectable, InternalServerErrorException } from '@nestjs/common';
import BaseService from '../base.service';
import Complaint from './entities/complaint.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import WriteComplaintDTO from './dto/write-complaint.dto';
import { Incident } from '../incidents/entities/incident.entity';
import ObtainComplaintsDTO from './dto/obtain-complaints.dto';
import RewriteComplaintDTO from './dto/rewrite-complaint.dto';
import { IncidentsService } from '../incidents/incidents.service';

@Injectable()
export class ComplaintsService extends BaseService<Complaint> {
  constructor(
    @InjectRepository(Complaint)
    complaintsRepo: Repository<Complaint>,
    private incidentsService: IncidentsService,
  ) {
    super(complaintsRepo);
  }

  async writeComplaint(
    user: User,
    writeComplaintDTO: WriteComplaintDTO,
  ): Promise<{ id: string }> {
    const { idIncident, idCounteredComplaint, content } = writeComplaintDTO;

    let incident: Incident;

    try {
      incident = await this.incidentsService.obtainOneBy({ id: idIncident });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during fetching the incident to which the complaint belongs: ${error.message}.`,
      );
    }

    let counteredComplaint: Complaint;

    if (idCounteredComplaint)
      counteredComplaint = await this.obtainOneBy({
        id: idCounteredComplaint,
      });

    const complaint: Complaint = this.repo.create({
      incident,
      content,
      counteredComplaint,
      author: user,
    });

    try {
      await this.repo.insert(complaint);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the complaint insertion: ${error.message}.`,
      );
    }

    this.dataLoggerService.create(complaint.constructor.name, complaint.id);

    return { id: idIncident };
  }

  async obtainComplaints(
    idIncident: string,
    obtainComplaintsDTO: ObtainComplaintsDTO,
  ): Promise<{ complaints: Complaint[]; count: number }> {
    const { writtenOrder, take } = obtainComplaintsDTO;

    let records: [Complaint[], number];

    try {
      records = await this.repo.findAndCount({
        where: { incident: { id: idIncident } },
        order: { written: writtenOrder },
        take,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during fetching the complaints: ${error.message}.`,
      );
    }

    return { complaints: records[0], count: records[1] };
  }

  async rewriteComplaint(
    id: string,
    rewriteComplaintDTO: RewriteComplaintDTO,
  ): Promise<{ id: string }> {
    const { content } = rewriteComplaintDTO;

    const complaint: Complaint = await this.obtainOneBy({
      id,
    });

    try {
      await this.repo.update(id, { content });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the complaint content update: ${error.message}.`,
      );
    }

    this.dataLoggerService.update(
      complaint.constructor.name,
      complaint.id,
      `content: ${complaint.content} = content: ${content}`,
    );

    return { id };
  }

  async withdrawComplaint(id: string): Promise<{ id: string }> {
    const complaint: Complaint = await this.obtainOneBy({
      id,
    });

    try {
      await this.repo.delete(id);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the complaint deletion: ${error.message}.`,
      );
    }

    this.dataLoggerService.delete(complaint.constructor.name, id);

    return { id };
  }
}
