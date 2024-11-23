import { Controller, Get, Query } from '@nestjs/common';
import { LocationiqService } from './locationiq.service';
import { PrivilegedRoute } from 'src/auth/privileged-route.decorator';
import { ReversedLocation, SearchedLocation } from './types';
import ReverseDTO from './dto/reverse.dto';
import SearchDTO from './dto/search.dto';
import { Observable } from 'rxjs';

@Controller('locationiq')
export class LocationiqController {
  constructor(private locationiqService: LocationiqService) {}

  @Get('/geocoding/reverse')
  @PrivilegedRoute('OFFEREE')
  reverse(@Query() reverseDTO: ReverseDTO): Observable<ReversedLocation> {
    return;
  }

  @Get('/geocoding/search')
  @PrivilegedRoute('SUPERUSER', 'OFFEROR')
  search(@Query() searchDTO: SearchDTO): Observable<SearchedLocation> {
    return;
  }
}
