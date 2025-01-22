import { SharedBullAsyncConfiguration, BullModuleOptions } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

const BullModuleAsyncConfig: SharedBullAsyncConfiguration = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (
    configService: ConfigService,
  ): Promise<BullModuleOptions> => ({
    redis: {
      port: configService.get('REDIS_PORT'),
      host: configService.get('REDIS_HOST'),
    },
  }),
};

export default BullModuleAsyncConfig;
