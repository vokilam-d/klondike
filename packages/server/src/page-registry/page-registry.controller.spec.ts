import { Test, TestingModule } from '@nestjs/testing';
import { PageRegistryController } from './page-registry.controller';

describe('PageRegistry Controller', () => {
  let controller: PageRegistryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PageRegistryController],
    }).compile();

    controller = module.get<PageRegistryController>(PageRegistryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
