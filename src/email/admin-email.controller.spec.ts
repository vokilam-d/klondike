import { Test, TestingModule } from '@nestjs/testing';
import { AdminEmailController } from './admin-email.controller';

describe('Email Controller', () => {
  let controller: AdminEmailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminEmailController],
    }).compile();

    controller = module.get<AdminEmailController>(AdminEmailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
