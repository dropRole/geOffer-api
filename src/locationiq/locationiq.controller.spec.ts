import { Test, TestingModule } from '@nestjs/testing';
import { LocationiqController } from './locationiq.controller';
import { LocationiqService } from './locationiq.service';
import {
  forwardGeocodingAPIResponse,
  reverseGeocodingAPIResponse,
} from '../testing-mocks';
import { ReversedLocation } from './types/reversed-location';
import SearchedLocation from './types/searched-location';

describe('LocationiqController', () => {
  let controller: LocationiqController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationiqController],
    })
      .useMocker((token) => {
        if (token === LocationiqService)
          return {
            reverse: jest.fn().mockReturnValue(reverseGeocodingAPIResponse),
            search: jest.fn().mockReturnValue(forwardGeocodingAPIResponse),
          };
      })
      .compile();

    controller = module.get<LocationiqController>(LocationiqController);
  });

  describe('reverse', () => {
    it('should return an instance of ReversedLocation', () => {
      expect(
        controller.reverse({ latLong: '43.883239, 20.347267' }),
      ).toMatchObject<ReversedLocation>(reverseGeocodingAPIResponse);
    });
  });

  describe('search', () => {
    it('should return an instance of SearchedLocation', () => {
      expect(
        controller.search({ query: '32000 Čačak, Kneza Vase Popovića 10' }),
      ).toMatchObject<SearchedLocation>(forwardGeocodingAPIResponse);
    });
  });
});
