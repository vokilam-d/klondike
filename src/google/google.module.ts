import { Module } from '@nestjs/common';
import { GoogleShoppingFeedService } from './google-shopping-feed.service';
import { AdminGoogleController } from './admin-google.controller';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [ProductModule],
  providers: [GoogleShoppingFeedService],
  controllers: [AdminGoogleController]
})
export class GoogleModule {}
