import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

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

export default OrmAsyncConfig;
