import { Module } from '@nestjs/common';
import { BackendInventoryService } from './backend-inventory.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BackendInventory, BackendInventoryModel } from './models/inventory.model';
import { BackendInventoryController } from './backendInventoryController';

const inventoryModel = {
  name: BackendInventoryModel.modelName,
  schema: BackendInventoryModel.schema,
  collection: BackendInventory.collectionName
};

@Module({
  imports: [MongooseModule.forFeature([inventoryModel])],
  providers: [BackendInventoryService],
  controllers: [BackendInventoryController],
  exports: [BackendInventoryService]
})
export class BackendInventoryModule {}
