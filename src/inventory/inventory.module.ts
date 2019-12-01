import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Inventory, InventoryModel } from './models/inventory.model';

const inventoryModel = {
  name: InventoryModel.modelName,
  schema: InventoryModel.schema,
  collection: Inventory.collectionName
};

@Module({
  imports: [MongooseModule.forFeature([inventoryModel])],
  providers: [InventoryService],
  controllers: [],
  exports: [InventoryService]
})
export class InventoryModule {}
