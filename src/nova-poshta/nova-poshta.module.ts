import { HttpModule, Module } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { SettlementController } from './controller/settlement.controller';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './controller/warehouse.controller';

@Module({
  imports: [
    HttpModule
  ],
  providers: [SettlementService,WarehouseService],
  controllers: [SettlementController,WarehouseController]
})
export class NovaPoshtaModule {
}
