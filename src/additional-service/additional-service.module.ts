import { Module } from '@nestjs/common';
import { AdditionalServiceService } from './services/additional-service.service';
import { AdminAdditionalServiceController } from './controllers/admin-additional-service.controller';
import { ClientAdditionalServiceController } from './controllers/client-additional-service.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AdditionalService, AdditionalServiceModel } from './models/additional-service.model';

const additionalServiceModel = {
  name: AdditionalServiceModel.modelName,
  schema: AdditionalServiceModel.schema,
  collection: AdditionalService.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([additionalServiceModel]),
  ],
  providers: [AdditionalServiceService],
  controllers: [AdminAdditionalServiceController, ClientAdditionalServiceController],
  exports: [AdditionalServiceService]
})
export class AdditionalServiceModule {}
