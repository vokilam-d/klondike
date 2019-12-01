import { Global, Module } from '@nestjs/common';
import { ConfigService } from './config/config.service';
import { CounterService } from './counter/counter.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Counter, CounterModel } from './counter/counter.model';
import { MediaService } from './media-uploader/media-uploader/media.service';

const counterModel = {
  name: CounterModel.modelName,
  schema: CounterModel.schema,
  collection: Counter.collectionName
};

@Global()
@Module({
  imports: [MongooseModule.forFeature([counterModel])],
  providers: [ConfigService, CounterService, MediaService],
  exports: [ConfigService, CounterService, MediaService]
})
export class SharedModule {}
