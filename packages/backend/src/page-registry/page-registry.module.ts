import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BackendPageModel, BackendPageRegistry } from './models/page-registry.model';
import { BackendPageRegistryService } from './page-registry.service';
import { BackendPageRegistryController } from './page-registry.controller';

const pageRegistryModel = {
  name: BackendPageModel.modelName,
  schema: BackendPageModel.schema,
  collection: BackendPageRegistry.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([pageRegistryModel])
  ],
  providers: [
    BackendPageRegistryService
  ],
  exports: [
    BackendPageRegistryService
  ],
  controllers: [
    BackendPageRegistryController
  ]
})
export class BackendPageRegistryModule {}
