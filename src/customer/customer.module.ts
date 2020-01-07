import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { AdminCustomerController } from './admin-customer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerModel } from './modesl/customer.model';

const customerModel = {
  name: CustomerModel.modelName,
  schema: CustomerModel.schema,
  collection: Customer.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([customerModel])
  ],
  providers: [CustomerService],
  controllers: [AdminCustomerController]
})
export class CustomerModule {}
