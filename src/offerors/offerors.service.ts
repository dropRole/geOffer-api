import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import BaseService from 'src/base.service';
import Offeror from './offeror.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  SelectQueryBuilder,
  QueryRunner,
  Repository,
} from 'typeorm';
import RecordOfferorDTO from './dto/record-offeror.dto';
import { AuthService } from 'src/auth/auth.service';
import User from 'src/auth/user.entity';
import * as bcrypt from 'bcrypt';
import ObtainOfferorsDTO from './dto/obtain-offerors.dto';
import OfferorReputation from './types/offeror-reputation';
import AmendBusinessInfoDTO from './dto/amend-business-info.dto';
import AlterReputationDTO from './dto/alter-reputation.dto';
import Reservation from 'src/reservations/reservation.entity';
import { ReservationsService } from 'src/reservations/reservations.service';

@Injectable()
export class OfferorsService extends BaseService<Offeror> {
  constructor(
    @InjectRepository(Offeror)
    offerorsRepo: Repository<Offeror>,
    private authService: AuthService,
    private dataSource: DataSource,
    @Inject(forwardRef(() => ReservationsService))
    private reservationsService: ReservationsService,
  ) {
    super(offerorsRepo);
  }

  async recordOfferor(
    recordOfferorDTO: RecordOfferorDTO,
  ): Promise<{ id: string }> {
    const { username } = recordOfferorDTO;

    let user: User;

    try {
      user = await this.authService.obtainOneBy({
        username,
      });
    } catch (error) {
      const { name, address, telephone, email, businessHours, password } =
        recordOfferorDTO;

      const hash: string = await bcrypt.hash(password, 9);

      user = this.dataSource.manager.create(User, {
        username,
        password: hash,
        privilege: 'OFFEROR',
      });

      const offeror: Offeror = this.repo.create({
        name,
        address: JSON.parse(address),
        telephone,
        email,
        businessHours,
        user,
        requests: [],
      });

      const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await queryRunner.manager.insert(User, user);
        await queryRunner.manager.insert(Offeror, offeror);

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();

        throw new InternalServerErrorException(
          `Error during data transaction: ${error.message}`,
        );
      }

      this.dataLoggerService.create(user.constructor.name, user.username);
      this.dataLoggerService.create(offeror.constructor.name, offeror.id);

      return { id: offeror.id };
    }

    throw new ConflictException(`Username ${username} is already in use.`);
  }

  async obtainOfferors(
    obtainOfferorsDTO: ObtainOfferorsDTO,
  ): Promise<Offeror[]> {
    interface ObtainedOfferor extends Offeror {
      reservationsMade: number;
    }

    const { name, city, reservationsMade, take } = obtainOfferorsDTO;

    const queryBuilder: SelectQueryBuilder<Offeror> =
      this.repo.createQueryBuilder('offeror');
    queryBuilder.where('UPPER(name) LIKE UPPER(:name)', {
      name: `%${name}%`,
    });

    if (city)
      queryBuilder.where("UPPER(address->'city'->>'name') LIKE UPPER(:city)", {
        city,
      });

    queryBuilder.take(take);

    let offerors: ObtainedOfferor[];

    try {
      offerors = await queryBuilder.execute();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during data fetch: ${error.message}`,
      );
    }

    if (reservationsMade) {
      offerors = await Promise.all(
        offerors.map(async (offeror): Promise<ObtainedOfferor> => {
          const reservations: Reservation[] =
            await this.reservationsService.obtainManyBy({
              request: { offeror: { id: offeror.id } },
            });

          offeror.reservationsMade = reservations.length;

          return offeror;
        }),
      );

      if (reservationsMade === 'ASC')
        offerors.sort((a: ObtainedOfferor, b: ObtainedOfferor) =>
          a.reservationsMade > b.reservationsMade ? -1 : 1,
        );
      else
        offerors.sort((a: ObtainedOfferor, b: ObtainedOfferor) =>
          a.reservationsMade > b.reservationsMade ? 1 : -1,
        );
    }

    this.dataLoggerService.read('Offeror', offerors.length);

    return offerors;
  }

  async claimBusinessInfo(
    user: User,
  ): Promise<Omit<Offeror, 'id' | 'reputation' | 'user' | 'requests'>> {
    const { name, address, telephone, email, businessHours } =
      await this.obtainOneBy({
        user: { username: user.username },
      });

    return {
      name,
      address,
      telephone,
      email,
      businessHours,
    };
  }

  async claimReputation(user: User): Promise<OfferorReputation> {
    const { reputation } = await this.obtainOneBy({
      user: { username: user.username },
    });

    return {
      responsiveness: reputation.responsiveness,
      compliance: reputation.compliance,
      timeliness: reputation.timeliness,
    };
  }

  async amendBusinessInfo(
    user: User,
    amendBusinessInfoDTO: AmendBusinessInfoDTO,
  ): Promise<void> {
    const offeror: Offeror = await this.obtainOneBy({
      user: { username: user.username },
    });

    const { name, address, telephone, email, businessHours } =
      amendBusinessInfoDTO;

    try {
      await this.repo.update(
        { user: { username: user.username } },
        { name, address: JSON.parse(address), telephone, email, businessHours },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during data update: ${error.message}`,
      );
    }

    this.dataLoggerService.update(
      offeror.constructor.name,
      offeror.id,
      `{ name: ${offeror.name}, address: ${JSON.stringify(
        offeror.address,
      )}, telephone: ${offeror.telephone}, email: ${
        offeror.email
      }, businessHours: ${
        offeror.businessHours
      } } => { name: ${name}, address: ${JSON.stringify(
        offeror.address,
      )}, telephone: ${telephone}, email: ${email}, businessHours: ${businessHours} }`,
    );
  }

  async alterReputation(
    id: string,
    alterReputationDTO: AlterReputationDTO,
  ): Promise<{ id: string }> {
    const offeror: Offeror = await this.obtainOneBy({ id });

    const { responsiveness, compliance, timeliness } = alterReputationDTO;

    try {
      await this.repo.update(
        { id },
        { reputation: { responsiveness, compliance, timeliness } },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during data update: ${error.message}`,
      );
    }

    this.dataLoggerService.update(
      offeror.constructor.name,
      offeror.id,
      `{ reputation: { ${offeror.reputation.responsiveness}, ${offeror.reputation.compliance}, ${offeror.reputation.timeliness} } } => { reputation: { ${responsiveness}, ${compliance}, ${timeliness} } }`,
    );

    return { id };
  }
}
