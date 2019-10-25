import { Test, TestingModule } from '@nestjs/testing';
import { BackendPageRegistryController } from './page-registry.controller';

describe('BackendPageRegistry Controller', () => {
  let controller: BackendPageRegistryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackendPageRegistryController],
    }).compile();

    controller = module.get<BackendPageRegistryController>(BackendPageRegistryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
