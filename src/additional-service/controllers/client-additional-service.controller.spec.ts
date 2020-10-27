import { Test, TestingModule } from '@nestjs/testing';
import { ClientAdditionalServiceController } from './client-additional-service.controller';

describe('ClientAdditionalService Controller', () => {
  let controller: ClientAdditionalServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientAdditionalServiceController],
    }).compile();

    controller = module.get<ClientAdditionalServiceController>(ClientAdditionalServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
