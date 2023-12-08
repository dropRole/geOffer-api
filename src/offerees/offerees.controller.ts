import { Controller, Get, Query, Body, Patch } from '@nestjs/common';
import { OffereesService } from './offerees.service';
import Offeree from './offeree.entity';
import ObtainOffereesDTO from './dto/obtain-offerees.dto';
import { PrivilegedRoute } from 'src/auth/privileged-route.decorator';
import ExtractUser from 'src/auth/extract-user.decorator';
import AmendBasicsDTO from './dto/amend-basics.dto';
import User from 'src/auth/user.entity';

@Controller('offerees')
export class OffereesController {
  constructor(private offereesService: OffereesService) {}

  @Get()
  @PrivilegedRoute('SUPERUSER')
  obtainOfferees(
    @Query() obtainOffereesDTO: ObtainOffereesDTO,
  ): Promise<Offeree[]> {
    return this.offereesService.obtainOfferees(obtainOffereesDTO);
  }

  @Get('/basics')
  @PrivilegedRoute('OFFEREE')
  claimBasics(
    @ExtractUser() user: User,
  ): Promise<Pick<Offeree, 'name' | 'surname' | 'email'>> {
    return this.offereesService.claimBasics(user);
  }

  @Patch('/basics')
  @PrivilegedRoute('OFFEREE')
  amendBasics(
    @ExtractUser() user: User,
    @Body() amendBasicsDTO: AmendBasicsDTO,
  ): Promise<void> {
    return this.offereesService.amendBasics(user, amendBasicsDTO);
  }
}
