import { Global, Module } from '@nestjs/common';
import { CounterService } from './services/counter/counter.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Counter, CounterModel } from './services/counter/counter.model';
import { MediaService } from './services/media/media.service';
import { SearchService } from './services/search/search.service';
import { EncryptorService } from './services/encryptor/encryptor.service';
import { EventsService } from './services/events/events.service';
import { XmlBuilder } from './services/xml-builder/xml-builder.service';

const counterModel = {
  name: CounterModel.modelName,
  schema: CounterModel.schema,
  collection: Counter.collectionName
};

@Global()
@Module({
  imports: [MongooseModule.forFeature([counterModel])],
  providers: [CounterService, MediaService, SearchService, EncryptorService, EventsService, XmlBuilder],
  exports: [CounterService, MediaService, SearchService, EncryptorService, EventsService, XmlBuilder]
})
export class SharedModule {}
