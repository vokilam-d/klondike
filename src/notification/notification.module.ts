import { Module } from '@nestjs/common';
import { NotificationService } from './services/notification.service';
import { OrderModule } from '../order/order.module';
import { StoreReviewModule } from '../reviews/store-review/store-review.module';
import { ProductReviewModule } from '../reviews/product-review/product-review.module';
import { AuthModule } from '../auth/auth.module';
import { CustomerModule } from '../customer/customer.module';
import { TasksModule } from '../tasks/tasks.module';
import { EmailModule } from '../email/email.module';
import { BotModule } from '../bot/bot.module';
import { TaxModule } from '../tax/tax.module';

@Module({
  imports: [OrderModule, StoreReviewModule, ProductReviewModule, AuthModule, CustomerModule, TasksModule, EmailModule, BotModule, TaxModule],
  providers: [NotificationService]
})
export class NotificationModule {
}
