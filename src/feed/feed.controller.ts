import { Controller, Get, Param, Res } from '@nestjs/common';
import { ShoppingFeedService } from './shopping-feed.service';
import { FastifyReply } from 'fastify';
import { ServerResponse } from 'http';
import { Language } from '../shared/enums/language.enum';

@Controller('feed')
export class FeedController {

  constructor(private readonly shoppingFeedService: ShoppingFeedService) {
  }

  @Get('shopping')
  async getRuGoogleShoppingAdsFeed(@Res() reply: FastifyReply<ServerResponse>) {
    const feed = await this.shoppingFeedService.generateGoogleShoppingAdsFeed(Language.RU);

    reply
      .type('text/xml')
      .header('Content-Disposition', `attachment;filename=${encodeURIComponent(Language.RU + "_" + this.shoppingFeedService.googleShoppingFeedFileName)}`)
      .send(feed);
  }

  @Get('shopping/google/:lang')
  async getGoogleShoppingAdsFeed(@Param('lang') lang: Language,
                                 @Res() reply: FastifyReply<ServerResponse>) {
    const feed = await this.shoppingFeedService.generateGoogleShoppingAdsFeed(lang);

    reply
      .type('text/xml')
      .header('Content-Disposition', `attachment;filename=${encodeURIComponent(lang + "_" + this.shoppingFeedService.googleShoppingFeedFileName)}`)
      .send(feed);
  }

  @Get('shopping/facebook')
  async getShoppingAdsFeedFacebook(@Res() reply: FastifyReply<ServerResponse>) {
    const feed = await this.shoppingFeedService.generateFacebookShoppingAdsFeed();

    reply
      .type('text/xml')
      .header('Content-Disposition', `attachment;filename=${encodeURIComponent(Language.RU + "_" + this.shoppingFeedService.facebookShoppingFeedFileName)}`)
      .send(feed);
  }

  @Get('shopping/facebook/localization/:lang')
  async getShoppingAdsUkrLanguageLocalizationFeedFacebook(@Param('lang') lang: Language,
                                                          @Res() reply: FastifyReply<ServerResponse>) {
    const feed = await this.shoppingFeedService.generateFacebookShoppingLocalizationFeed(lang);

    reply
      .type('text/xml')
      .header('Content-Disposition', `attachment;filename=${encodeURIComponent(lang + "_" + this.shoppingFeedService.facebookShoppingLocalizationFeedFileName)}`)
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
