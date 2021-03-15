import { Test, TestingModule } from '@nestjs/testing';
import { AdminBannerController } from './admin-banner.controller';

describe('AdminBanner Controller', () => {
  let controller: AdminBannerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminBannerController],
    }).compile();

    controller = module.get<AdminBannerController>(AdminBannerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
