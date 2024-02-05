import { Test, TestingModule } from '@nestjs/testing';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';
import User from '../auth/user.entity';
import WriteComplaintDTO from './dto/write-complaint.dto';
import Complaint from './complaint.entity';
import {
  mockComplaintsRepo,
  mockIncidentsRepo,
  mockUsersRepo,
} from '../testing-mocks';
import Incident from '../incidents/incident.entity';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import ObtainComplaintsDTO from './dto/obtain-complaints.dto';
import RewriteComplaintDTO from './dto/rewrite-complaint.dto';

let complaintsRepo: Complaint[] = mockComplaintsRepo;

describe('ComplaintsController', () => {
  let controller: ComplaintsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComplaintsController],
    })
      .useMocker((token) => {
        if (token === ComplaintsService)
          return {
            writeComplaint: jest
              .fn()
              .mockImplementation(
                (
                  user: User,
                  writeComplaintDTO: WriteComplaintDTO,
                ): { id: string } => {
                  const { content, idCounteredComplaint, idIncident } =
                    writeComplaintDTO;

                  const incident: Incident = mockIncidentsRepo.find(
                    (incident) => incident.id === idIncident,
                  );

                  if (
                    incident.reservation.request.offeree.user.username !==
                      user.username &&
                    incident.reservation.request.offeror.user.username !==
                      user.username
                  )
                    throw new UnauthorizedException(
                      `You're not a participant in the ${idIncident} incident.`,
                    );

                  let counteredComplaint: Complaint;

                  if (counteredComplaint) {
                    counteredComplaint = complaintsRepo.find(
                      (complaint) => complaint.id === idCounteredComplaint,
                    );

                    if (!counteredComplaint)
                      throw new NotFoundException(
                        `The complaint identified with ${idCounteredComplaint} wasn't found.`,
                      );
                  }

                  const complaint: Complaint = {
                    id: uuidv4(),
                    content,
                    written: new Date().toString(),
                    edited: undefined,
                    author: user,
                    counteredComplaint,
                    incident,
                  };

                  complaintsRepo.push(complaint);

                  return { id: complaint.id };
                },
              ),
            obtainComplaints: jest
              .fn()
              .mockImplementation(
                (
                  user: User,
                  idIncident: string,
                  obtainComplaintsDTO: ObtainComplaintsDTO,
                ): Complaint[] => {
                  const incident: Incident = mockIncidentsRepo.find(
                    (incident) => incident.id === idIncident,
                  );

                  if (
                    user.privilege !== 'SUPERUSER' &&
                    incident.reservation.request.offeree.user.username !==
                      user.username &&
                    incident.reservation.request.offeror.user.username !==
                      user.username
                  )
                    throw new UnauthorizedException(
                      `You're not a participant in the ${idIncident} incident.`,
                    );

                  const { writtenOrder, take } = obtainComplaintsDTO;

                  const complaints: Complaint[] = complaintsRepo.filter(
                    (complaint) => complaint.incident.id === idIncident,
                  );

                  if (writtenOrder === 'ASC')
                    complaints.sort((a, b) =>
                      new Date(a.written) > new Date(b.written) ? -1 : 1,
                    );

                  if (writtenOrder === 'DESC')
                    complaints.sort((a, b) =>
                      new Date(a.written) > new Date(b.written) ? 1 : -1,
                    );

                  return complaints.slice(take);
                },
              ),
            rewriteComplaint: jest
              .fn()
              .mockImplementation(
                (
                  user: User,
                  id: string,
                  rewriteComplaintDTO: RewriteComplaintDTO,
                ): { id: string } => {
                  const rewrittenComplaint: Complaint = complaintsRepo.find(
                    (complaint) => complaint.id === id,
                  );

                  if (rewrittenComplaint.author.username !== user.username)
                    throw new UnauthorizedException(
                      `You haven't wrote the ${id} complaint.`,
                    );

                  const { content } = rewriteComplaintDTO;

                  rewrittenComplaint.content = content;

                  complaintsRepo = complaintsRepo.map((complaint) => {
                    if (complaint.id === rewrittenComplaint.id)
                      return rewrittenComplaint;

                    return complaint;
                  });

                  return { id };
                },
              ),
            withdrawComplaint: jest
              .fn()
              .mockImplementation((user: User, id: string): { id: string } => {
                const complaint: Complaint = complaintsRepo.find(
                  (complaint) => complaint.id === id,
                );

                if (complaint.author.username !== user.username)
                  throw new UnauthorizedException(
                    `You haven't wrote the ${id} complaint.`,
                  );

                complaintsRepo = complaintsRepo.map((complaint) => {
                  if (complaint.id !== complaint.id) return complaint;

                  return complaint;
                });

                return { id };
              }),
          };
      })
      .compile();

    controller = module.get<ComplaintsController>(ComplaintsController);
  });

  describe('writeComplaint', () => {
    it('should return an object holding id property', () => {
      const writeComplaintDTO: WriteComplaintDTO = {
        content: "I'll give you an offer.",
        idCounteredComplaint: undefined,
        idIncident: mockIncidentsRepo[mockIncidentsRepo.length - 1].id,
      };

      expect(
        controller.writeComplaint(
          mockIncidentsRepo[mockIncidentsRepo.length - 1].openedBy,
          writeComplaintDTO,
        ),
      ).toMatchObject<{ id: string }>({ id: expect.any(String) });
    });

    it('should throw an UnauthorizedException', () => {
      const writeComplaintDTO: WriteComplaintDTO = {
        content: "I'll give you an offer.",
        idCounteredComplaint: undefined,
        idIncident: mockIncidentsRepo[1].id,
      };

      expect(() =>
        controller.writeComplaint(
          mockIncidentsRepo[mockIncidentsRepo.length - 1].openedBy,
          writeComplaintDTO,
        ),
      ).toThrow(
        `You're not a participant in the ${mockIncidentsRepo[1].id} incident.`,
      );
    });
  });

  describe('obtainComplaints', () => {
    it('should return an instance of the Complaint array', () => {
      const obtainComplaintsDTO: ObtainComplaintsDTO = {
        writtenOrder: 'ASC',
        take: 5,
      };

      expect(
        controller.obtainComplaints(
          mockUsersRepo[0],
          mockIncidentsRepo[0].id,
          obtainComplaintsDTO,
        ),
      ).toBeInstanceOf(Array<Complaint>);
    });
  });

  describe('rewriteComplaint', () => {
    it('should return an object holding id property', () => {
      const rewriteComplaintDTO: RewriteComplaintDTO = {
        content: "I'll give you an offer that you won't resist.",
      };

      expect(
        controller.rewriteComplaint(
          mockUsersRepo[1],
          complaintsRepo[complaintsRepo.length - 1].id,
          rewriteComplaintDTO,
        ),
      ).toMatchObject<{ id: string }>({
        id: complaintsRepo[complaintsRepo.length - 1].id,
      });
    });

    it('should throw an UnauthorizedException', () => {
      const rewriteComplaintDTO: RewriteComplaintDTO = {
        content: "I'll give you an offer that you won't resist.",
      };

      expect(() =>
        controller.rewriteComplaint(
          mockUsersRepo[0],
          complaintsRepo[complaintsRepo.length - 1].id,
          rewriteComplaintDTO,
        ),
      ).toThrow(
        `You haven't wrote the ${
          complaintsRepo[complaintsRepo.length - 1].id
        } complaint.`,
      );
    });
  });

  describe('withdrawComplaint', () => {
    it('should return an object holding id property', () => {
      expect(
        controller.withdrawComplaint(
          mockUsersRepo[1],
          complaintsRepo[complaintsRepo.length - 1].id,
        ),
      ).toMatchObject<{ id: string }>({
        id: complaintsRepo[complaintsRepo.length - 1].id,
      });
    });
  });
});
