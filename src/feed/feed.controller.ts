import { Controller, Get, Res } from '@nestjs/common';
import { ShoppingFeedService } from './shopping-feed.service';
import { FastifyReply } from 'fastify';
import { ServerResponse } from 'http';

@Controller('feed')
export class FeedController {

  constructor(private readonly shoppingFeedService: ShoppingFeedService) {
  }

  @Get('shopping')
  async getShoppingAdsFeed(@Res() reply: FastifyReply<ServerResponse>) {
    const feed = await this.shoppingFeedService.generateGoogleShoppingAdsFeed();

    reply
      .type('text/xml')
      .header('Content-Disposition', `attachment;filename=${encodeURIComponent(this.shoppingFeedService.googleShoppingFeedFileName)}`)
      .send(feed);
  }

  @Get('shopping/facebook')
  async getShoppingAdsFeedFacebook(@Res() reply: FastifyReply<ServerResponse>) {
    const feed = await this.shoppingFeedService.generateFacebookShoppingAdsFeed();

    reply
      .type('text/xml')
      .header('Content-Disposition', `attachment;filename=${encodeURIComponent(this.shoppingFeedService.facebookShoppingFeedFileName)}`)
      .send(feed);
  }

  @Get('reviews')
  async getProductReviewsFeed(@Res() reply: FastifyReply<ServerResponse>) {
    const feed = await this.shoppingFeedService.generateGoogleProductReviewsFeed();

    reply
      .type('text/xml')
      .header('Content-Disposition', `attachment;filename=${encodeURIComponent(this.shoppingFeedService.reviewsFeedFileName)}`)
      .send(feed);
  }
}
