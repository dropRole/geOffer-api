import { Body, Controller, Post, Get, Param, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import SignupDTO from './dto/signup.dto';
import { PublicRoute } from './public-route.decorator';
import { Token } from './types';
import LoginDTO from './dto/login.dto';
import { PrivilegedRoute } from './privileged-route.decorator';
import User from './user.entity';
import ExtractUser from './extract-user.decorator';
import AlterUsernameDTO from './dto/alter-username.dto';
import AlterPasswordDTO from './dto/alter-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @PublicRoute()
  signup(@Body() signupDTO: SignupDTO): Promise<void> {
    return this.authService.signup(signupDTO);
  }

  @Post('/login')
  @PublicRoute()
  login(@Body() loginDTO: LoginDTO): Promise<Token> {
    return this.authService.login(loginDTO);
  }

  @Get('/:username/token')
  @PublicRoute()
  signToken(@Param('username') username: string): Promise<Token> {
    return this.authService.signToken(username);
  }

  @Get('/basics')
  @PrivilegedRoute('SUPERUSER', 'OFFEREE', 'OFFEROR')
  claimBasics(
    @ExtractUser() user: User,
  ): Omit<User, 'password' | 'incidents' | 'complaints'> {
    return {
      username: user.username,
      privilege: user.privilege,
      created: user.created,
    };
  }

  @Patch('/username')
  @PrivilegedRoute('SUPERUSER', 'OFFEREE', 'OFFEROR')
  alterUsername(
    @ExtractUser() user: User,
    @Body() alterUsernameDTO: AlterUsernameDTO,
  ): Promise<Token> {
    return this.authService.alterUsername(user, alterUsernameDTO);
  }

  @Patch('/password')
  @PrivilegedRoute('SUPERUSER', 'OFFEREE', 'OFFEROR')
  alterPassword(
    @ExtractUser() user: User,
    @Body() alterPasswordDTO: AlterPasswordDTO,
  ): Promise<void> {
    return this.authService.alterPassword(user, alterPasswordDTO);
  }
}
