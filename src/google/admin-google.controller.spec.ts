import { Test, TestingModule } from '@nestjs/testing';
import { AdminGoogleController } from './admin-google.controller';

describe('Google Controller', () => {
  let controller: AdminGoogleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminGoogleController],
    }).compile();

    controller = module.get<AdminGoogleController>(AdminGoogleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
