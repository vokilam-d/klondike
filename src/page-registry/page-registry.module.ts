import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PageModel, PageRegistry } from './models/page-registry.model';
import { PageRegistryService } from './page-registry.service';
import { PageRegistryController } from './page-registry.controller';

const pageRegistryModel = {
  name: PageModel.modelName,
  schema: PageModel.schema,
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
  ],
  controllers: [
    PageRegistryController
  ]
})
export class PageRegistryModule {}
