import { Controller, Get, Res } from '@nestjs/common';
import { GoogleShoppingFeedService } from './google-shopping-feed.service';
import { FastifyReply } from 'fastify';
import { ServerResponse } from 'http';

@Controller('feed')
export class FeedController { // todo rename to AdminFeedController

  constructor(private readonly googleShoppingFeedService: GoogleShoppingFeedService) {
  }

  @Get('shopping')
  async getShoppingAdsFeed(@Res() reply: FastifyReply<ServerResponse>) {
    const feed = await this.googleShoppingFeedService.generateShoppingAdsFeed();

    reply
      .type('text/xml')
      .header('Content-Disposition', `attachment;filename=${encodeURIComponent(this.googleShoppingFeedService.shoppingFeedFileName)}`)
      .send(feed);
  }

  @Get('reviews')
  async getProductReviewsFeed(@Res() reply: FastifyReply<ServerResponse>) {
    const feed = await this.googleShoppingFeedService.generateProductReviewsFeed();

    reply
      .type('text/xml')
      .header('Content-Disposition', `attachment;filename=${encodeURIComponent(this.googleShoppingFeedService.reviewsFeedFileName)}`)
      .send(feed);
  }
}
