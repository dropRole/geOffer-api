import { Test, TestingModule } from '@nestjs/testing';
import { OffereesController } from './offerees.controller';

describe('OffereesController', () => {
  let controller: OffereesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OffereesController],
    }).compile();

    controller = module.get<OffereesController>(OffereesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
