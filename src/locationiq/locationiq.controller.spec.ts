import { Test, TestingModule } from '@nestjs/testing';
import { LocationiqController } from './locationiq.controller';

describe('LocationiqController', () => {
  let controller: LocationiqController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationiqController],
    }).compile();

    controller = module.get<LocationiqController>(LocationiqController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
