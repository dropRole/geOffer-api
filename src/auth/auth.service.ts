import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import BaseService from 'src/common/services/base.service';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';
import Offeree from '../offerees/entities/offeree.entity';
import SignupDTO from './dto/signup.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import LoginDTO from './dto/login.dto';
import AlterUsernameDTO from './dto/alter-username.dto';
import AlterPasswordDTO from './dto/alter-password.dto';
import { Response } from 'express';
import * as moment from 'moment';

@Injectable()
export class AuthService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    usersRepo: Repository<User>,
    private dataSource: DataSource,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    super(usersRepo);
  }

  async signup(signupDTO: SignupDTO): Promise<void> {
    const { username } = signupDTO;

    let user: User;

    try {
      user = await this.repo.findOneBy({ username });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the username existence check: ${error.message}.`,
      );
    }

    if (user)
      throw new ConflictException(`Username ${username} is already in use.`);

    const { password, name, surname, email } = signupDTO;

    const hash: string = await bcrypt.hash(password, 9);

    user = this.repo.create({ username, password: hash, privilege: 'OFFEREE' });

    const offeree: Offeree = this.dataSource.manager.create(Offeree, {
      name,
      surname,
      email,
      user,
    });

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      await queryRunner.manager.insert(User, user);
      await queryRunner.manager.insert(Offeree, offeree);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw new InternalServerErrorException(
        `Error during the user and offeree insertion transaction: ${error.message}.`,
      );
    }

    this.dataLoggerService.create(user.constructor.name, user.username);
    this.dataLoggerService.create(offeree.constructor.name, offeree.id);
  }

  async refreshToken(user: User, response: Response): Promise<void> {
    await this.obtainOneBy({ username: user.username });

    const payload: JwtPayload = { username: user.username };

    const token: string = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_SECRET'),
      expiresIn: this.configService.getOrThrow('JWT_EXPIRE'),
    });

    const todaysDate = moment(new Date());

    response.cookie('JWT', token, {
      httpOnly: true,
      secure: process.env.STAGE === 'prod',
      expires: todaysDate
        .add(this.configService.getOrThrow('JWT_EXPIRE'), 'seconds')
        .toDate(),
    });
  }

  async login(loginDTO: LoginDTO, response: Response): Promise<void> {
    const { username, password } = loginDTO;

    const user: User = await this.repo.findOneBy({ username });

    const payload: JwtPayload = { username };

    if (user && (await bcrypt.compare(password, user.password))) {
      const token: string = this.jwtService.sign(payload, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
        expiresIn: this.configService.getOrThrow('JWT_EXPIRE'),
      });

      const refreshToken: string = this.jwtService.sign(payload, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRE'),
      });

      const todaysDate = moment(new Date());

      response.cookie('JWT', token, {
        httpOnly: true,
        secure: process.env.STAGE === 'prod',
        expires: todaysDate
          .add(this.configService.getOrThrow('JWT_EXPIRE'), 'seconds')
          .toDate(),
      });

      response.cookie('JWTRefresh', refreshToken, {
        httpOnly: true,
        secure: process.env.STAGE === 'prod',
        expires: todaysDate
          .add(this.configService.getOrThrow('JWT_REFRESH_EXPIRE'), 'seconds')
          .toDate(),
      });

      return;
    }

    throw new UnauthorizedException('Check your credentials.');
  }

  async alterUsername(
    user: User,
    alterUsernameDTO: AlterUsernameDTO,
    response: Response,
  ): Promise<void> {
    const { username } = alterUsernameDTO;

    const inUse: User = await this.repo.findOneBy({ username });

    if (inUse)
      throw new ConflictException(`Username ${username} is already in use.`);

    try {
      await this.repo.update({ username: user.username }, { username });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the username update: ${error.message}.`,
      );
    }

    const payload: JwtPayload = { username };

    const token: string = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_SECRET'),
      expiresIn: this.configService.getOrThrow('JWT_EXPIRE'),
    });

    const refreshToken: string = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRE'),
    });

    const todaysDate = moment(new Date());

    response.cookie('JWT', token, {
      httpOnly: true,
      secure: process.env.STAGE === 'prod',
      expires: todaysDate
        .add(this.configService.getOrThrow('JWT_EXPIRE'), 'seconds')
        .toDate(),
    });

    response.cookie('JWTRefresh', refreshToken, {
      httpOnly: true,
      secure: process.env.STAGE === 'prod',
      expires: todaysDate
        .add(this.configService.getOrThrow('JWT_REFRESH_EXPIRE'), 'seconds')
        .toDate(),
    });

    this.dataLoggerService.update(
      user.constructor.name,
      user.username,
      `username: ${user.username} => username: ${username}`,
    );
  }

  async alterPassword(
    user: User,
    alterPasswordDTO: AlterPasswordDTO,
  ): Promise<void> {
    const { password, newPassword } = alterPasswordDTO;

    if (password && !(await bcrypt.compare(password, user.password)))
      throw new ConflictException('Invalid current password.');

    const hash: string = await bcrypt.hash(newPassword, 9);

    try {
      await this.repo.update({ username: user.username }, { password: hash });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the password update: ${error.message}.`,
      );
    }

    this.dataLoggerService.update(user.constructor.name, user.username, 'PASS');
  }
}
