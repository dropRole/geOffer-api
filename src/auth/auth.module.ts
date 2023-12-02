import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import User from './user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtAsyncRegister, PassportRegister } from 'src/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register(PassportRegister),
    JwtModule.registerAsync(JwtAsyncRegister),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
