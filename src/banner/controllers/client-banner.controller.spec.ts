import { Test, TestingModule } from '@nestjs/testing';
import { ClientBannerController } from './client-banner.controller';

describe('ClientBanner Controller', () => {
  let controller: ClientBannerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientBannerController],
    }).compile();

    controller = module.get<ClientBannerController>(ClientBannerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
