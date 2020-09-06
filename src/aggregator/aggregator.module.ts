import { Module } from '@nestjs/common';
import { AggregatorService } from './services/aggregator.service';
import { AdminAggregatorController } from './controllers/admin-aggregator.controller';
import { ClientAggregatorController } from './controllers/client-aggregator.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Aggregator, AggregatorModel } from './models/aggregator.model';
import { ProductModule } from '../product/product.module';

const aggregatorModel = {
  name: AggregatorModel.modelName,
  schema: AggregatorModel.schema,
  collection: Aggregator.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([aggregatorModel]),
    ProductModule
  ],
  providers: [AggregatorService],
  controllers: [AdminAggregatorController, ClientAggregatorController]
})
export class AggregatorModule {}
