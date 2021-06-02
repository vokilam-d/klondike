import { Module } from '@nestjs/common';
import { ShoppingFeedService } from './shopping-feed.service';
import { FeedController } from './feed.controller';
import { ProductModule } from '../product/product.module';
import { ProductReviewModule } from '../reviews/product-review/product-review.module';
import { AttributeModule } from '../attribute/attribute.module';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [ProductModule, ProductReviewModule, AttributeModule, MaintenanceModule, CategoryModule],
  providers: [ShoppingFeedService],
  controllers: [FeedController]
})
export class FeedModule {}
