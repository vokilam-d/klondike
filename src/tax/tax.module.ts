import { HttpModule, Module } from '@nestjs/common';
import { TaxService } from './services/tax.service';
import { ShiftController } from './controllers/shift.controller';
import { CheckboxConnector } from './services/checkbox.connector';
import { ReceiptController } from './controllers/receipt.controller';

@Module({
  imports: [HttpModule],
  providers: [TaxService, CheckboxConnector],
  controllers: [ShiftController, ReceiptController]
})
export class TaxModule {}
