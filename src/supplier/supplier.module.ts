import { Module } from '@nestjs/common';
import { AdminSupplierController } from './controllers/admin-supplier.controller';
import { SupplierService } from './services/supplier.service';
import { Supplier, SupplierModel } from './models/supplier.model';
import { MongooseModule } from '@nestjs/mongoose';


const supplierModel = {
  name: SupplierModel.modelName,
  schema: SupplierModel.schema,
  collection: Supplier.collectionName
};


@Module({
  imports: [
    MongooseModule.forFeature([supplierModel])
  ],
  controllers: [AdminSupplierController],
  providers: [SupplierService]
})
export class SupplierModule {}
