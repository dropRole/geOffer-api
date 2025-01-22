import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { PrivilegedRoute } from '../common/decorators/privileged-route.decorator';
import CurrentUser from '../auth/current-user.decorator';
import OpenIncidentDTO from './dto/open-incident.dto';
import { Incident } from './entities/incident.entity';
import ObtainIncidentsDTO from './dto/obtain-incidents.dto';
import RenameIncidentDTO from './dto/rename-incident.dto';
import AlterIncidentStatusDTO from './dto/alter-incident-status.dto';
import { User } from '../auth/entities/user.entity';

@Controller('incidents')
export class IncidentsController {
  constructor(private incidentsService: IncidentsService) {}

  @Post()
  @PrivilegedRoute('OFFEREE', 'OFFEROR')
  openIncident(
    @CurrentUser() user: User,
    @Body() openIncidentDTO: OpenIncidentDTO,
  ): Promise<{ id: string }> {
    return this.incidentsService.openIncident(user, openIncidentDTO);
  }

  @Get('/:idReservation')
  @PrivilegedRoute('SUPERUSER', 'OFFEREE', 'OFFEROR')
  obtainIncidents(
    @Param('idReservation') idReservation: string,
    @Query() obtainIncidentsDTO: ObtainIncidentsDTO,
  ): Promise<{ incidents: Incident[]; count: number }> {
    return this.incidentsService.obtainIncidents(
      idReservation,
      obtainIncidentsDTO,
    );
  }

  @Patch('/:id/title')
  @PrivilegedRoute('OFFEREE', 'OFFEROR')
  renameIncident(
    @Param('id') id: string,
    @Body() renameIncidentDTO: RenameIncidentDTO,
  ): Promise<{ id: string }> {
    return this.incidentsService.renameIncident(id, renameIncidentDTO);
  }

  @Patch('/:id/status')
  @PrivilegedRoute('SUPERUSER')
  alterIncidentStatus(
    @Param('id') id: string,
    @Body() alterIncidentStatusDTO: AlterIncidentStatusDTO,
  ): Promise<{ id: string }> {
    return this.incidentsService.alterIncidentStatus(
      id,
      alterIncidentStatusDTO,
    );
  }

  @Delete('/:id')
  @PrivilegedRoute('SUPERUSER', 'OFFEREE', 'OFFEROR')
  closeIncident(@Param('id') id: string): Promise<{ id: string }> {
    return this.incidentsService.closeIncident(id);
  }
}
