import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { GoogleShoppingFeedService } from './google-shopping-feed.service';
import { FastifyReply } from 'fastify';
import { ServerResponse } from 'http';
import { UserJwtGuard } from '../auth/services/guards/user-jwt.guard';

@UseGuards(UserJwtGuard)
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

  @Get('reviews-feed')
  async getProductReviewsFeed(@Res() reply: FastifyReply<ServerResponse>) {
    const feed = await this.googleShoppingFeedService.generateProductReviewsFeed();

    reply
      .type('text/xml')
      .header('Content-Disposition', `attachment;filename=${encodeURIComponent(this.googleShoppingFeedService.reviewsFeedFileName)}`)
      .send(feed);
  }
}
