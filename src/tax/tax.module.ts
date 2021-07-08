import { HttpModule, Module } from '@nestjs/common';
import { TaxService } from './services/tax.service';
import { ShiftController } from './controllers/shift.controller';
import { CheckboxConnector } from './services/checkbox.connector';
import { ReceiptController } from './controllers/receipt.controller';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [HttpModule, OrderModule],
  providers: [TaxService, CheckboxConnector],
  controllers: [ShiftController, ReceiptController],
  exports: [TaxService]
})
export class TaxModule {}
