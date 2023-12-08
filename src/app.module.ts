import {
  Module,
  ClassSerializerInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { OffereesModule } from './offerees/offerees.module';
import { OfferorsModule } from './offerors/offerors.module';
import { RequestsModule } from './requests/requests.module';
import { ReservationsModule } from './reservations/reservations.module';
import { IncidentsModule } from './incidents/incidents.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { ProhibitionsModule } from './prohibitions/prohibitions.module';
import { LocationiqModule } from './locationiq/locationiq.module';
import { DataLoggerModule } from './data-logger/data-logger.module';
import { ConfigModule } from '@nestjs/config';
import { EnvConfig, OrmAsyncConfig } from './config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtGuard } from './auth/jwt.guard';
import { PrivilegeGuard } from './auth/privilege.guard';

@Module({
  imports: [
    AuthModule,
    OffereesModule,
    OfferorsModule,
    RequestsModule,
    ReservationsModule,
    IncidentsModule,
    ComplaintsModule,
    ProhibitionsModule,
    LocationiqModule,
    DataLoggerModule,
    ConfigModule.forRoot(EnvConfig),
    TypeOrmModule.forRootAsync(OrmAsyncConfig),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PrivilegeGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
