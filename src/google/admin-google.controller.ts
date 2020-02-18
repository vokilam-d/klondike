import { Controller, Get } from '@nestjs/common';
import { GoogleShoppingFeedService } from './google-shopping-feed.service';

@Controller('admin/google')
export class AdminGoogleController {

  constructor(private readonly googleShoppingFeedService: GoogleShoppingFeedService) {
  }

  @Get('shopping-feed')
  getShoppingAdsFeed() {
    return this.googleShoppingFeedService.generateShoppingAdsFeed();
  }
}
