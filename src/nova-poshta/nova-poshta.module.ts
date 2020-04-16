import { HttpModule, Module } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { SettlementController } from './controller/settlementController';

@Module({
  imports: [
    HttpModule
  ],
  providers: [SettlementService],
  controllers: [SettlementController]
})
export class NovaPoshtaModule {
}
