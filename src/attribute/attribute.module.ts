import { Module } from '@nestjs/common';
import { AdminAttributeController } from './admin-attribute.controller';
import { AttributeService } from './attribute.service';
import { Attribute, AttributeModel } from './models/attribute.model';
import { MongooseModule } from '@nestjs/mongoose';

const attributeModel = {
  name: AttributeModel.modelName,
  schema: AttributeModel.schema,
  collection: Attribute.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([attributeModel])
  ],
  controllers: [AdminAttributeController],
  providers: [AttributeService]
})
export class AttributeModule {}
