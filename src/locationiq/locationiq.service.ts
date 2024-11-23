import { Injectable } from '@nestjs/common';
import ReverseDTO from './dto/reverse.dto';
import { ReversedLocation, SearchedLocation } from './types';
import { Observable, map } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import SearchDTO from './dto/search.dto';

@Injectable()
export class LocationiqService {
  private API_KEY: string = process.env.LOCATIONIQ_API_KEY;

  constructor(private httpService: HttpService) {}

  reverse(reverseDTO: ReverseDTO): Observable<ReversedLocation> {
    const { latLong } = reverseDTO;

    const lat = latLong.substring(0, latLong.indexOf(','));

    const long = latLong.substring(latLong.indexOf(','), latLong.length - 1);

    return this.httpService
      .get<ReversedLocation>(
        `https://us1.locationiq.com/v1/reverse?key=${this.API_KEY}&lat=${lat}&lon=${long}&format=json`,
      )
      .pipe(map((response) => response.data));
  }

  search(searchDTO: SearchDTO): Observable<SearchedLocation> {
    const { query } = searchDTO;

    return this.httpService
      .get<ReversedLocation>(
        `https://us1.locationiq.com/v1/search?key=${this.API_KEY}&q=${query}&format=json`,
      )
      .pipe(map((response) => response.data));
  }
}
