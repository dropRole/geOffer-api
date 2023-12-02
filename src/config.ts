import { ConfigModuleOptions } from '@nestjs/config';
import EnvConfigValidationSchema from './env-validation.schema';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModuleOptions } from '@nestjs/passport';
import { JwtModuleAsyncOptions } from '@nestjs/jwt';

const EnvConfig: ConfigModuleOptions = {
  validationSchema: EnvConfigValidationSchema,
  envFilePath: `.env.stage.${process.env.STAGE}`,
};

const OrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (
    configService: ConfigService,
  ): Promise<TypeOrmModuleOptions> => ({
    type: 'postgres',
    port: configService.get('PG_PORT'),
    host: configService.get('PG_HOST'),
    database: configService.get('PG_DATABASE'),
    username: configService.get('PG_USERNAME'),
    password: configService.get('PG_PASSWORD'),
    autoLoadEntities: true,
    synchronize: process.env.STAGE === 'dev' ? true : false,
  }),
};

const PassportRegister: AuthModuleOptions = {
  defaultStrategy: 'jwt',
};

const JwtAsyncRegister: JwtModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get('JWT_SECRET'),
    signOptions: {
      expiresIn: configService.get('JWT_EXPIRE'),
    },
  }),
};

export { EnvConfig, OrmAsyncConfig, PassportRegister, JwtAsyncRegister };
