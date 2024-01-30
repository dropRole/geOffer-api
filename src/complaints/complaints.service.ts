import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import BaseService from 'src/base.service';
import Complaint from './complaint.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import User from 'src/auth/user.entity';
import WriteComplaintDTO from './dto/write-complaint.dto';
import Incident from 'src/incidents/incident.entity';
import ObtainComplaintsDTO from './dto/obtain-complaints.dto';
import RewriteComplaintDTO from './dto/rewrite-complaint.dto';

@Injectable()
export class ComplaintsService extends BaseService<Complaint> {
  constructor(
    @InjectRepository(Complaint)
    private complaintsRepo: Repository<Complaint>,
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
      this.dataLoggerService.error(
        `Error during Incident record fetch: ${error.message}`,
      );

      throw new InternalServerErrorException(
        `Error during data fetch: ${error.message}`,
      );
    }

    if (
      incident.reservation.request.offeree.user.username !== user.username &&
      incident.reservation.request.offeror.user.username !== user.username
    )
      throw new UnauthorizedException(
        `Cannot write a complaint due to not being a participant in the ${idIncident} incident.`,
      );

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
      this.dataLoggerService.error(
        `Error during Complaint record fetch: ${error.message}`,
      );

      throw new InternalServerErrorException(
        `Error during data insert: ${error.message}`,
      );
    }

    this.dataLoggerService.create(complaint.constructor.name, complaint.id);

    return { id: idIncident };
  }

  async obtainComplaints(
    user: User,
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

    let incident: Incident;

    try {
      incident = await query.getOne();
    } catch (error) {
      this.dataLoggerService.error(
        `Error during Incident record fetch: ${error.message}`,
      );

      throw new InternalServerErrorException(
        `Error during data fetch: ${error.message}`,
      );
    }

    if (
      user.privilege !== 'SUPERUSER' &&
      incident.reservation.request.offeree.user.username !== user.username &&
      incident.reservation.request.offeror.user.username !== user.username
    )
      throw new UnauthorizedException(
        `You're not taking part in the ${idIncident} incident.`,
      );

    const { writtenOrder, take } = obtainComplaintsDTO;

    let complaints: Complaint[];

    try {
      complaints = await this.repo.find({
        where: { incident: { id: idIncident } },
        order: { written: writtenOrder },
        take,
      });
    } catch (error) {
      this.dataLoggerService.error(
        `Error during Complaint records fetch: ${error.message}`,
      );

      throw new InternalServerErrorException(
        `Error during data fetch: ${error.message}`,
      );
    }

    return complaints;
  }

  async rewriteComplaint(
    user: User,
    id: string,
    rewriteComplaintDTO: RewriteComplaintDTO,
  ): Promise<{ id: string }> {
    const { content } = rewriteComplaintDTO;

    const complaint: Complaint = await this.obtainOneBy({
      id,
    });

    if (complaint.author.username !== user.username)
      throw new UnauthorizedException(
        `You're not an author of the ${id} complaint.`,
      );

    try {
      await this.repo.update(id, { content });
    } catch (error) {
      this.dataLoggerService.error(
        `Error during Complaint record update: ${error.message}`,
      );

      throw new InternalServerErrorException(
        `Error during data update: ${error.message}`,
      );
    }

    this.dataLoggerService.update(
      complaint.constructor.name,
      complaint.id,
      `content: ${complaint.content} = content: ${content}`,
    );

    return { id };
  }

  async withdrawComplaint(user: User, id: string): Promise<{ id: string }> {
    const complaint: Complaint = await this.obtainOneBy({
      id,
    });

    if (complaint.author.username !== user.username)
      throw new UnauthorizedException(
        `You're not an author of the ${id} complaint.`,
      );

    try {
      await this.repo.delete(id);
    } catch (error) {
      this.dataLoggerService.error(
        `Error during Complaint record deletion: ${error.message}`,
      );

      throw new InternalServerErrorException(
        `Error during data deletion: ${error.message}`,
      );
    }

    this.dataLoggerService.delete(complaint.constructor.name, id);

    return { id };
  }
}
