import { Test, TestingModule } from '@nestjs/testing';
import { OfferorsController } from './offerors.controller';

describe('OfferorsController', () => {
  let controller: OfferorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OfferorsController],
    }).compile();

    controller = module.get<OfferorsController>(OfferorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
