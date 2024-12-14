import { Injectable, InternalServerErrorException } from '@nestjs/common';
import BaseService from 'src/base.service';
import Complaint from './complaint.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import User from '../auth/user.entity';
import WriteComplaintDTO from './dto/write-complaint.dto';
import Incident from '../incidents/incident.entity';
import ObtainComplaintsDTO from './dto/obtain-complaints.dto';
import RewriteComplaintDTO from './dto/rewrite-complaint.dto';

@Injectable()
export class ComplaintsService extends BaseService<Complaint> {
  constructor(
    @InjectRepository(Complaint)
    complaintsRepo: Repository<Complaint>,
    private dataSource: DataSource,
  ) {
    super(complaintsRepo);
  }

  async writeComplaint(
    user: User,
    writeComplaintDTO: WriteComplaintDTO,
  ): Promise<{ id: string }> {
    const { idIncident, idCounteredComplaint, content } = writeComplaintDTO;

    const query: SelectQueryBuilder<Incident> =
      this.dataSource.createQueryBuilder(Incident, 'incident');
    query.innerJoinAndSelect('incident.reservation', 'reservation');
    query.innerJoinAndSelect('reservation.request', 'request');
    query.innerJoinAndSelect('request.offeree', 'offeree');
    query.innerJoinAndSelect('offeree.user', 'offereeUser');
    query.innerJoinAndSelect('request.offeror', 'offeror');
    query.innerJoinAndSelect('offeror.user', 'offerorUser');
    query.where('incident.id = :idIncident', { idIncident });

    let incident: Incident;

    try {
      incident = await query.getOne();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during fetching the incident to which the complaint belongs: ${error.message}`,
      );
    }

    const counteredComplaint: Complaint = await this.obtainOneBy({
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
        `Error during the complaint insertion: ${error.message}`,
      );
    }

    this.dataLoggerService.create(complaint.constructor.name, complaint.id);

    return { id: idIncident };
  }

  async obtainComplaints(
    idIncident: string,
    obtainComplaintsDTO: ObtainComplaintsDTO,
  ): Promise<Complaint[]> {
    const query: SelectQueryBuilder<Incident> =
      this.dataSource.createQueryBuilder(Incident, 'incident');
    query.innerJoinAndSelect('incident.reservation', 'reservation');
    query.innerJoinAndSelect('reservation.request', 'request');
    query.innerJoinAndSelect('request.offeree', 'offeree');
    query.innerJoinAndSelect('offeree.user', 'offereeUser');
    query.innerJoinAndSelect('request.offeror', 'offeror');
    query.innerJoinAndSelect('offeror.user', 'offerorUser');
    query.where('incident.id = :idIncident', { idIncident });

    const { writtenOrder, take } = obtainComplaintsDTO;

    let complaints: Complaint[];

    try {
      complaints = await this.repo.find({
        where: { incident: { id: idIncident } },
        order: { written: writtenOrder },
        take,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during fetching the complaints: ${error.message}`,
      );
    }

    return complaints;
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
        `Error during the complaint content update: ${error.message}`,
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
        `Error during the complaint deletion: ${error.message}`,
      );
    }

    this.dataLoggerService.delete(complaint.constructor.name, id);

    return { id };
  }
}
