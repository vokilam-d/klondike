import { Module } from '@nestjs/common';
import { GoogleShoppingFeedService } from './google-shopping-feed.service';
import { FeedController } from './feed.controller';
import { ProductModule } from '../product/product.module';
import { ProductReviewModule } from '../reviews/product-review/product-review.module';

@Module({
  imports: [ProductModule, ProductReviewModule],
  providers: [GoogleShoppingFeedService],
  controllers: [FeedController]
})
export class GoogleModule {}
