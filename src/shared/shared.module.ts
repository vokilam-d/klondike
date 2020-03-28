import { Global, Module } from '@nestjs/common';
import { CounterService } from './counter/counter.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Counter, CounterModel } from './counter/counter.model';
import { MediaService } from './media-service/media.service';
import { SearchService } from './search/search.service';
import { EncryptorService } from './services/encryptor/encryptor.service';

const counterModel = {
  name: CounterModel.modelName,
  schema: CounterModel.schema,
  collection: Counter.collectionName
};

@Global()
@Module({
  imports: [MongooseModule.forFeature([counterModel])],
  providers: [CounterService, MediaService, SearchService, EncryptorService],
  exports: [CounterService, MediaService, SearchService, EncryptorService]
})
export class SharedModule {}
