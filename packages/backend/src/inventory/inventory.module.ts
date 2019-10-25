import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Inventory } from './models/inventory.model';
import { InventoryController } from './inventory.controller';

const inventoryModel = {
  name: Inventory.model.modelName,
  schema: Inventory.model.schema,
  collection: Inventory.collectionName
};

@Module({
  imports: [MongooseModule.forFeature([inventoryModel])],
  providers: [InventoryService],
  controllers: [InventoryController],
  exports: [InventoryService]
})
export class InventoryModule {}
