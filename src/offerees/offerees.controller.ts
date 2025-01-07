import { Controller, Get, Query, Body, Patch } from '@nestjs/common';
import { OffereesService } from './offerees.service';
import Offeree from './entities/offeree.entity';
import ObtainOffereesDTO from './dto/obtain-offerees.dto';
import { PrivilegedRoute } from '../common/decorators/privileged-route.decorator';
import CurrentUser from 'src/auth/current-user.decorator';
import AmendBasicsDTO from './dto/amend-basics.dto';
import { User } from '../auth/entities/user.entity';

@Controller('offerees')
export class OffereesController {
  constructor(private offereesService: OffereesService) {}

  @Get()
  @PrivilegedRoute('SUPERUSER')
  obtainOfferees(
    @Query() obtainOffereesDTO: ObtainOffereesDTO,
  ): Promise<{ offerees: Offeree[]; count: number }> {
    return this.offereesService.obtainOfferees(obtainOffereesDTO);
  }

  @Get('/basics')
  @PrivilegedRoute('OFFEREE')
  claimBasics(
    @CurrentUser() user: User,
  ): Promise<Pick<Offeree, 'name' | 'surname' | 'email'>> {
    return this.offereesService.claimBasics(user);
  }

  @Patch('/basics')
  @PrivilegedRoute('OFFEREE')
  amendBasics(
    @CurrentUser() user: User,
    @Body() amendBasicsDTO: AmendBasicsDTO,
  ): Promise<void> {
    return this.offereesService.amendBasics(user, amendBasicsDTO);
  }
}
