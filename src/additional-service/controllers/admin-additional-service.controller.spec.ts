import { Test, TestingModule } from '@nestjs/testing';
import { AdminAdditionalServiceController } from './admin-additional-service.controller';

describe('AdminAdditionalService Controller', () => {
  let controller: AdminAdditionalServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAdditionalServiceController],
    }).compile();

    controller = module.get<AdminAdditionalServiceController>(AdminAdditionalServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
