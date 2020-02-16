import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { AdminEmailController } from './admin-email.controller';
import { PdfGeneratorModule } from '../pdf-generator/pdf-generator.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [PdfGeneratorModule, OrderModule],
  providers: [EmailService],
  controllers: [AdminEmailController]
})
export class EmailModule {}
