import { Module } from '@nestjs/common';
import { BackendInventoryService } from './backend-inventory.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BackendInventory } from './models/inventory.model';
import { BackendInventoryController } from './backendInventoryController';

const inventoryModel = {
  name: BackendInventory.model.modelName,
  schema: BackendInventory.model.schema,
  collection: BackendInventory.collectionName
};

@Module({
  imports: [MongooseModule.forFeature([inventoryModel])],
  providers: [BackendInventoryService],
  controllers: [BackendInventoryController],
  exports: [BackendInventoryService]
})
export class BackendInventoryModule {}
