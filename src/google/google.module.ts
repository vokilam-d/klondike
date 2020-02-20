import { Module } from '@nestjs/common';
import { GoogleShoppingFeedService } from './google-shopping-feed.service';
import { AdminGoogleController } from './admin-google.controller';
import { ProductModule } from '../product/product.module';
import { ProductReviewModule } from '../reviews/product-review/product-review.module';

@Module({
  imports: [ProductModule, ProductReviewModule],
  providers: [GoogleShoppingFeedService],
  controllers: [AdminGoogleController]
})
export class GoogleModule {}
