import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Offeree from './offeree.entity';
import { SelectQueryBuilder, Repository } from 'typeorm';
import BaseService from 'src/base.service';
import ObtainOffereesDTO from './dto/obtain-offerees.dto';
import User from 'src/auth/user.entity';
import AmendBasicsDTO from './dto/amend-basics.dto';

@Injectable()
export class OffereesService extends BaseService<Offeree> {
  constructor(
    @InjectRepository(Offeree)
    offereesRepo: Repository<Offeree>,
  ) {
    super(offereesRepo);
  }

  async obtainOfferees(
    obtainOffereesDTO: ObtainOffereesDTO,
  ): Promise<Offeree[]> {
    const { fullname, requestsMade, take } = obtainOffereesDTO;

    const queryBuilder: SelectQueryBuilder<Offeree> =
      this.repo.createQueryBuilder('offeree');
    queryBuilder.leftJoin('offeree.requests', 'request');
    queryBuilder.addSelect('COUNT(request.*)', "'requestsMade'");
    queryBuilder.where('UPPER(name || surname) LIKE UPPER(:fullname)', {
      fullname: `%${fullname}%`,
    });

    if (requestsMade) queryBuilder.orderBy("'requestsMade'");

    queryBuilder.take(take);

    queryBuilder.groupBy('offeree.id');

    let offerees: Offeree[];

    try {
      offerees = await queryBuilder.execute();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during fetching the offerees: ${error.message}`,
      );
    }

    return offerees;
  }

  async claimBasics(
    user: User,
  ): Promise<Pick<Offeree, 'name' | 'surname' | 'email'>> {
    const { name, surname, email } = await this.obtainOneBy({
      user: { username: user.username },
    });

    return { name, surname, email };
  }

  async amendBasics(user: User, amendBasicsDTO: AmendBasicsDTO): Promise<void> {
    const { name, surname, email } = amendBasicsDTO;

    try {
      await this.repo.update(
        { user: { username: user.username } },
        { name, surname, email },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the offeree basics update: ${error.message}`,
      );
    }

    const offeree: Offeree = await this.obtainOneBy({
      user: { username: user.username },
    });

    this.dataLoggerService.update(
      offeree.constructor.name,
      offeree.id,
      `{ name: ${offeree.name}, surname: ${offeree.surname}, email: ${offeree.email} } => { name: ${name}, surname: ${surname}, email: ${email} }`,
    );
  }
}
