import { HttpModule, Module } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { SettlementController } from './controller/settlement.controller';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './controller/warehouse.controller';
import { NovaPoshtaService } from './nova-poshta.service';
import { StreetController } from './controller/street.controller';

@Module({
  imports: [
    HttpModule
  ],
  providers: [SettlementService,WarehouseService,NovaPoshtaService],
  controllers: [SettlementController,WarehouseController,StreetController],
  exports: [NovaPoshtaService]
})
export class NovaPoshtaModule {
}
