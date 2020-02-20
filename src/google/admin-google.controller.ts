import { Controller, Get, Res } from '@nestjs/common';
import { GoogleShoppingFeedService } from './google-shopping-feed.service';
import { FastifyReply } from 'fastify';
import { ServerResponse } from 'http';

@Controller('admin/google')
export class AdminGoogleController {

  constructor(private readonly googleShoppingFeedService: GoogleShoppingFeedService) {
  }

  @Get('shopping-feed')
  async getShoppingAdsFeed(@Res() reply: FastifyReply<ServerResponse>) {
    const feed = await this.googleShoppingFeedService.generateShoppingAdsFeed();

    reply
      .type('text/xml')
      .header('Content-Disposition', `attachment;filename=${encodeURIComponent(this.googleShoppingFeedService.shoppingFeedFileName)}`)
      .send(feed);
  }
}
