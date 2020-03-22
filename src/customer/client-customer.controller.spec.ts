import { Test, TestingModule } from '@nestjs/testing';
import { ClientCustomerController } from './client-customer.controller';

describe('ClientCustomer Controller', () => {
  let controller: ClientCustomerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientCustomerController],
    }).compile();

    controller = module.get<ClientCustomerController>(ClientCustomerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
