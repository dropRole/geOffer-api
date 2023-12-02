import { Test, TestingModule } from '@nestjs/testing';
import { ProhibitionsController } from './prohibitions.controller';

describe('ProhibitionsController', () => {
  let controller: ProhibitionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProhibitionsController],
    }).compile();

    controller = module.get<ProhibitionsController>(ProhibitionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
