import { HttpModule, Module } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { SettlementController } from './controller/settlement.controller';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './controller/warehouse.controller';
import { NovaPoshtaService } from './nova-poshta.service';
import { StreetController } from './controller/street.controller';
import { ShipmentSender, ShipmentSenderModel } from './models/shipment-sender.model';
import { MongooseModule } from '@nestjs/mongoose';
import { ShipmentSenderController } from './controller/shipment-sender.controller';
import { ShipmentSenderService } from './shipment-sender.service';
import { ShipmentRecipientController } from './controller/shipment-recipient.controller';

const shipmentSenderModel = {
  name: ShipmentSenderModel.modelName,
  schema: ShipmentSenderModel.schema,
  collection: ShipmentSender.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([shipmentSenderModel]),
    HttpModule
  ],
  providers: [
    SettlementService,
    WarehouseService,
    NovaPoshtaService,
    ShipmentSenderService
  ],
  controllers: [
    SettlementController,
    WarehouseController,
    StreetController,
    ShipmentSenderController,
    ShipmentRecipientController
  ],
  exports: [
    NovaPoshtaService,
    ShipmentSenderService
  ]
})
export class NovaPoshtaModule {
}
