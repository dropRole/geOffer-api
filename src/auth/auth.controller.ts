import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Patch,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import SignupDTO from './dto/signup.dto';
import { PublicRoute } from '../common/decorators/public-route.decorator';
import LoginDTO from './dto/login.dto';
import { PrivilegedRoute } from '../common/decorators/privileged-route.decorator';
import { User } from './entities/user.entity';
import CurrentUser from './current-user.decorator';
import AlterUsernameDTO from './dto/alter-username.dto';
import AlterPasswordDTO from './dto/alter-password.dto';
import JwtRefreshGuard from 'src/common/guards/jwt-refresh.guard';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @PublicRoute()
  signup(@Body() signupDTO: SignupDTO): Promise<void> {
    return;
  }

  @Post('/login')
  @PublicRoute()
  login(
    @Body() loginDTO: LoginDTO,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    return;
  }

  @Post('/refresh-token')
  @UseGuards(JwtRefreshGuard)
  @PublicRoute()
  refreshToken(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    return;
  }

  @Get('/basics')
  @PrivilegedRoute('SUPERUSER', 'OFFEREE', 'OFFEROR')
  claimBasics(
    @CurrentUser() user: User,
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
    @CurrentUser() user: User,
    @Body() alterUsernameDTO: AlterUsernameDTO,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    return;
  }

  @Patch('/password')
  @PrivilegedRoute('SUPERUSER', 'OFFEREE', 'OFFEROR')
  alterPassword(
    @CurrentUser() user: User,
    @Body() alterPasswordDTO: AlterPasswordDTO,
  ): Promise<void> {
    return;
  }
}
