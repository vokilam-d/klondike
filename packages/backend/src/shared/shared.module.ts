import { Global, Module } from '@nestjs/common';
import { BackendConfigService } from './config/config.service';
import { BackendCounterService } from './counter/counter.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BackendCounter, BackendCounterModel } from './counter/counter.model';
import { BackendMediaService } from './media-uploader/media-uploader/backend-media.service';

const counterModel = {
  name: BackendCounterModel.modelName,
  schema: BackendCounterModel.schema,
  collection: BackendCounter.collectionName
};

@Global()
@Module({
  imports: [MongooseModule.forFeature([counterModel])],
  providers: [BackendConfigService, BackendCounterService, BackendMediaService],
  exports: [BackendConfigService, BackendCounterService, BackendMediaService]
})
export class SharedModule {}
