import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import SignupDTO from './dto/signup.dto';
import LoginDTO from './dto/login.dto';
import Token from './types/token';
import User from './user.entity';
import AlterUsernameDTO from './dto/alter-username.dto';
import AlterPasswordDTO from './dto/alter-password.dto';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JWTSecret, mockOffereesRepo, mockUsersRepo } from '../testing-mocks';
import Offeree from '../offerees/offeree.entity';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jwt-simple';

let usersRepo: User[] = mockUsersRepo;

const offereesRepo: Offeree[] = mockOffereesRepo;

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
    })
      .useMocker((token) => {
        if (token === AuthService)
          return {
            signup: jest
              .fn()
              .mockImplementation((signupDTO: SignupDTO): void => {
                const { username } = signupDTO;

                const exists: User | undefined = usersRepo.find(
                  (user) => user.username === username,
                );

                if (exists)
                  throw new ConflictException(
                    `Useranme ${username} is already in use.`,
                  );

                const { password, name, surname, email } = signupDTO;

                const newUser: User = {
                  username,
                  privilege: 'OFFEREE',
                  password: bcrypt.hashSync(password, bcrypt.genSaltSync(9)),
                  created: new Date().toLocaleString(),
                  incidents: [],
                  complaints: [],
                };

                const newOfferee: Offeree = {
                  id: uuidv4(),
                  name,
                  surname,
                  email,
                  user: newUser,
                  requests: [],
                };

                usersRepo.push(newUser);

                offereesRepo.push(newOfferee);

                return;
              }),
            login: jest.fn().mockImplementation((loginDTO: LoginDTO): Token => {
              const { username, password } = loginDTO;

              const user: User = usersRepo.find(
                (user) => user.username === username,
              );

              if (user && bcrypt.compareSync(password, user.password))
                return {
                  type: 'access',
                  value: jwt.encode({ username }, JWTSecret),
                  expire: new Date(new Date().setDate(new Date().getDate() + 1))
                    .getTime()
                    .toString(),
                };

              throw new UnauthorizedException('Check your credentials.');
            }),
            signToken: jest
              .fn()
              .mockImplementation((username: string): Token => {
                return {
                  type: 'access',
                  value: jwt.encode({ username }, JWTSecret),
                  expire: new Date(new Date().setDate(new Date().getDate() + 1))
                    .getTime()
                    .toString(),
                };
              }),
            claimBasics: jest
              .fn()
              .mockImplementation(
                (
                  username: string,
                ): Omit<User, 'password' | 'incidents' | 'complaints'> => {
                  const user: User = usersRepo.find(
                    (user) => user.username === username,
                  );

                  const { privilege, created } = user;

                  return { username, privilege, created };
                },
              ),
            alterUsername: jest
              .fn()
              .mockImplementation(
                (user: User, alterUsernameDTO: AlterUsernameDTO): Token => {
                  const { username } = alterUsernameDTO;

                  const inUse: User | undefined = usersRepo.find(
                    (user) => user.username === username,
                  );

                  if (inUse)
                    throw new ConflictException(
                      `Username ${username} is already in use.`,
                    );

                  usersRepo = usersRepo.map((user) => {
                    if (user.username === username) user.username = username;

                    return user;
                  });

                  return {
                    type: 'access',
                    value: jwt.encode({ username }, JWTSecret),
                    expire: new Date(
                      new Date().setDate(new Date().getDate() + 1),
                    )
                      .getTime()
                      .toString(),
                  };
                },
              ),
            alterPassword: jest
              .fn()
              .mockImplementation(
                (user: User, alterPasswordDTO: AlterPasswordDTO): void => {
                  const { password, newPassword } = alterPasswordDTO;

                  if (password && !bcrypt.compareSync(password, user.password))
                    throw new ConflictException('Invalid current password.');

                  usersRepo = usersRepo.map((mockUser) => {
                    if (mockUser.username === user.username)
                      mockUser.password = bcrypt.hashSync(newPassword, 9);

                    return mockUser;
                  });
                },
              ),
          };
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('signup', () => {
    it('should be void', () => {
      const dto: SignupDTO = {
        username: 'babydoe',
        password: 'babyDoe@23',
        name: 'Baby',
        surname: 'Doe',
        email: 'babydoe@email.com',
      };

      expect(controller.signup(dto)).toBeUndefined();
    });

    it('should throw a ConflictException', () => {
      const dto: SignupDTO = {
        username: 'johndoe',
        password: 'babyDoe@23',
        name: 'Baby',
        surname: 'Doe',
        email: 'babydoe@email.com',
      };

      expect(() => controller.signup(dto)).toThrow(
        `Useranme ${dto.username} is already in use.`,
      );
    });
  });

  describe('login', () => {
    it('should return an object holding type, value and expire properties', () => {
      const dto: LoginDTO = {
        username: usersRepo[0].username,
        password: 'johnDoe@23',
      };

      expect(controller.login(dto)).toMatchObject<Token>({
        type: 'access',
        value: expect.any(String),
        expire: expect.any(String),
      });
    });

    it('should throw a UnauthorizedException', () => {
      const dto: LoginDTO = {
        username: usersRepo[0].username,
        password: usersRepo[1].password,
      };

      expect(() => controller.login(dto)).toThrow('Check your credentials.');
    });
  });

  describe('signJWT', () => {
    it('should return an object holding type, value and expire properties', () => {
      expect(controller.signToken(usersRepo[0].username)).toMatchObject<Token>({
        type: 'access',
        value: expect.any(String),
        expire: expect.any(String),
      });
    });
  });

  describe('claimBasics', () => {
    it('should return an object holding username, privilege and created properties', () => {
      expect(controller.claimBasics(usersRepo[0])).toMatchObject<
        Omit<User, 'password' | 'incidents' | 'complaints'>
      >({
        username: usersRepo[0].username,
        privilege: usersRepo[0].privilege,
        created: usersRepo[0].created,
      });
    });
  });

  describe('alterUsername', () => {
    it('should return an object holding username, privilege and created properties', () => {
      expect(
        controller.alterUsername(usersRepo[0], {
          username: `${usersRepo[0].username}_alter`,
        }),
      ).toMatchObject<Token>({
        type: 'access',
        value: expect.any(String),
        expire: expect.any(String),
      });
    });

    it('should throw a ConflictException', () => {
      expect(() =>
        controller.alterUsername(usersRepo[0], {
          username: `${usersRepo[1].username}`,
        }),
      ).toThrow(`Username ${usersRepo[1].username} is already in use.`);
    });
  });

  describe('alterPassword', () => {
    it('should be void', () => {
      expect(
        controller.alterPassword(usersRepo[0], {
          password: 'johnDoe@23',
          newPassword: 'johnDoe@23_alter',
        }),
      ).toBeUndefined();
    });

    it('should throw a ConflictException', () => {
      expect(() =>
        controller.alterPassword(usersRepo[0], {
          password: 'johnDOE@23',
          newPassword: 'johnDoe@23_alter',
        }),
      ).toThrow('Invalid current password');
    });
  });
});
