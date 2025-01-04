import { Module } from '@nestjs/common';
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
import EnvConfig from './config/env.config';
import OrmAsyncConfig from './config/orm.config';
import { TypeOrmModule } from '@nestjs/typeorm';

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
})
export class AppModule {}
