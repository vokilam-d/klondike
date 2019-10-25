import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BackendPageRegistry } from './models/page-registry.model';
import { BackendPageRegistryService } from './page-registry.service';
import { BackendPageRegistryController } from './page-registry.controller';

const pageRegistryModel = {
  name: BackendPageRegistry.model.modelName,
  schema: BackendPageRegistry.model.schema,
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
