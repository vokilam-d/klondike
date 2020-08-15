import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { AdminEmailController } from './admin-email.controller';
import { PdfGeneratorModule } from '../pdf-generator/pdf-generator.module';

@Module({
  imports: [
    PdfGeneratorModule
  ],
  providers: [EmailService],
  controllers: [AdminEmailController],
  exports: [EmailService]
})
export class EmailModule {
}
