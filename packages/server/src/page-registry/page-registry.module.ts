import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PageRegistry } from './models/page-registry.model';
import { PageRegistryService } from './page-registry.service';

const pageRegistryModel = {
  name: PageRegistry.modelName,
  schema: PageRegistry.model.schema,
  collection: PageRegistry.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([pageRegistryModel])
  ],
  providers: [
    PageRegistryService
  ],
  exports: [
    PageRegistryService
  ]
})
export class PageRegistryModule {}
