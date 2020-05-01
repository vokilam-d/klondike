import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { GoogleShoppingFeedService } from './google-shopping-feed.service';
import { FastifyReply } from 'fastify';
import { ServerResponse } from 'http';
import { UserJwtGuard } from '../auth/guards/user-jwt.guard';

@UseGuards(UserJwtGuard)
@Controller('admin/google') // todo rename to "admin/feed"
export class AdminGoogleController { // todo rename to AdminFeedController

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

  @Get('reviews-feed')
  async getProductReviewsFeed(@Res() reply: FastifyReply<ServerResponse>) {
    const feed = await this.googleShoppingFeedService.generateProductReviewsFeed();

    reply
      .type('text/xml')
      .header('Content-Disposition', `attachment;filename=${encodeURIComponent(this.googleShoppingFeedService.reviewsFeedFileName)}`)
      .send(feed);
  }
}
