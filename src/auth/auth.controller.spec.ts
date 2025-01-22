import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import SignupDTO from './dto/signup.dto';
import LoginDTO from './dto/login.dto';
import { User } from './entities/user.entity';
import AlterUsernameDTO from './dto/alter-username.dto';
import AlterPasswordDTO from './dto/alter-password.dto';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { mockOffereesRepo, mockUsersRepo } from '../testing-mocks';
import Offeree from '../offerees/entities/offeree.entity';
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';

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
                    `Username ${username} is already in use.`,
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
            login: jest
              .fn()
              .mockImplementation(
                (loginDTO: LoginDTO, response: Response): void => {
                  const { username, password } = loginDTO;

                  const user: User = usersRepo.find(
                    (user) => user.username === username,
                  );

                  if (!(user && bcrypt.compareSync(password, user.password)))
                    throw new UnauthorizedException('Check your credentials.');
                },
              ),
            refreshToken: jest.fn().mockReturnValue(undefined),
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
                (user: User, alterUsernameDTO: AlterUsernameDTO): void => {
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
    const signupDTO: SignupDTO = {
      username: 'babydoe',
      password: 'babydoe@24',
      name: 'Baby',
      surname: 'Doe',
      email: 'babydoe@email.com',
    };

    it('should be void', () => {
      expect(controller.signup(signupDTO)).toBeUndefined();
    });

    it('should throw a ConflictException', () => {
      signupDTO.username = 'johndoe';

      expect(() => controller.signup(signupDTO)).toThrow(
        `Username ${signupDTO.username} is already in use.`,
      );
    });
  });

  describe('login', () => {
    const loginDTO: LoginDTO = {
      username: usersRepo[0].username,
      password: 'geoffer@Admin24',
    };

    it('should be void', () => {
      expect(controller.login(loginDTO, undefined)).toBeUndefined();
    });

    it('should throw a UnauthorizedException', () => {
      loginDTO.password = usersRepo[1].password;

      expect(() => controller.login(loginDTO, undefined)).toThrow(
        'Check your credentials.',
      );
    });
  });

  describe('refreshToken', () => {
    it('should be void', () => {
      expect(controller.refreshToken(usersRepo[0], undefined)).toBeUndefined();
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
    it('should be void', () => {
      expect(
        controller.alterUsername(
          usersRepo[0],
          {
            username: `${usersRepo[0].username}_alter`,
          },
          undefined,
        ),
      ).toBeUndefined();
    });

    it('should throw a ConflictException', () => {
      expect(() =>
        controller.alterUsername(
          usersRepo[0],
          {
            username: `${usersRepo[1].username}`,
          },
          undefined,
        ),
      ).toThrow(`Username ${usersRepo[1].username} is already in use.`);
    });
  });

  describe('alterPassword', () => {
    it('should be void', () => {
      expect(
        controller.alterPassword(usersRepo[1], {
          password: 'johnDoe@24',
          newPassword: 'johnDoe@24Alter',
        }),
      ).toBeUndefined();
    });

    it('should throw a ConflictException', () => {
      expect(() =>
        controller.alterPassword(usersRepo[1], {
          password: 'johnDOE@24',
          newPassword: 'johnDoe@24_alter',
        }),
      ).toThrow('Invalid current password');
    });
  });
});
