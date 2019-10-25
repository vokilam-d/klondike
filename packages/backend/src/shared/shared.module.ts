import { Global, Module } from '@nestjs/common';
import { BackendConfigService } from './config/config.service';
import { BackendCounterService } from './counter/counter.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BackendCounter } from './counter/counter.model';

const counterModel = {
  name: BackendCounter.model.modelName,
  schema: BackendCounter.model.schema,
  collection: BackendCounter.collectionName
};

@Global()
@Module({
  imports: [MongooseModule.forFeature([counterModel])],
  providers: [BackendConfigService, BackendCounterService],
  exports: [BackendConfigService, BackendCounterService]
})
export class SharedModule {}
