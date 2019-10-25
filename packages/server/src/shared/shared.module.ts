import { Global, Module } from '@nestjs/common';
import { ConfigService } from './config/config.service';
import { MapperService } from './mapper/mapper.service';
import { CounterService } from './counter/counter.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Counter } from './counter/counter.model';

const counterModel = {
  name: Counter.model.modelName,
  schema: Counter.model.schema,
  collection: Counter.collectionName
};

@Global()
@Module({
  imports: [MongooseModule.forFeature([counterModel])],
  providers: [ConfigService, MapperService, CounterService],
  exports: [ConfigService, MapperService, CounterService]
})
export class SharedModule {}
