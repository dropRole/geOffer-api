import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import BaseService from '../base.service';
import User from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';
import Offeree from '../offerees/offeree.entity';
import SignupDTO from './dto/signup.dto';
import { JwtPayload, Token } from './types';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import LoginDTO from './dto/login.dto';
import AlterUsernameDTO from './dto/alter-username.dto';
import AlterPasswordDTO from './dto/alter-password.dto';

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
      user = await this.repo.findOne({ where: { username } });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the username existence check: ${error.message}`,
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

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.insert(User, user);
      await queryRunner.manager.insert(Offeree, offeree);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw new InternalServerErrorException(
        `Error during the user and offeree insertion transaction: ${error.message}`,
      );
    }

    this.dataLoggerService.create(user.constructor.name, user.username);
    this.dataLoggerService.create(offeree.constructor.name, offeree.id);
  }

  async signToken(username: string): Promise<Token> {
    const payload: JwtPayload = { username };

    const token: string = await this.jwtService.signAsync(payload);

    return {
      type: 'access',
      value: token,
      expire: this.configService.get('JWT_EXPIRE'),
    };
  }

  async login(loginDTO: LoginDTO): Promise<Token> {
    const { username, password } = loginDTO;

    const user: User = await this.obtainOneBy({ username });

    if (user && (await bcrypt.compare(password, user.password)))
      return await this.signToken(username);

    throw new UnauthorizedException('Check your credentials.');
  }

  async alterUsername(
    user: User,
    alterUsernameDTO: AlterUsernameDTO,
  ): Promise<Token> {
    const { username } = alterUsernameDTO;

    const inUse: User = await this.obtainOneBy({ username });

    if (inUse)
      throw new ConflictException(`Username ${username} is already in use.`);

    try {
      await this.repo.update({ username: user.username }, { username });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during the username update: ${error.message}`,
      );
    }

    this.dataLoggerService.update(
      user.constructor.name,
      user.username,
      `username: ${user.username} => username: ${username}`,
    );

    return await this.signToken(username);
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
        `Error during the password update: ${error.message}`,
      );
    }

    this.dataLoggerService.update(user.constructor.name, user.username, 'PASS');
  }
}
