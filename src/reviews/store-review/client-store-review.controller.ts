import { Body, Controller, Get, Param, Post, Query, Redirect, Req, Request, Response, UsePipes, ValidationPipe } from '@nestjs/common';
import { StoreReviewService } from './store-review.service';
import { IpAddress } from '../../shared/decorators/ip-address.decorator';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { AuthService } from '../../auth/services/auth.service';
import { ModuleRef } from '@nestjs/core';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';
import { ClientMediaDto } from '../../shared/dtos/client/media.dto';
import { ClientAddStoreReviewDto, ClientAddStoreReviewFromEmailDto } from '../../shared/dtos/client/add-store-review.dto';
import { ClientStoreReviewDto } from '../../shared/dtos/client/store-review.dto';
import { ClientId } from '../../shared/decorators/client-id.decorator';
import { ClientStoreReviewsSPFDto } from '../../shared/dtos/client/store-reviews-spf.dto';
import { ClientLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';
import { MultilingualText } from '../../shared/models/multilingual-text.model';
import { AdminMediaDto } from '../../shared/dtos/admin/media.dto';
import { ReviewSource } from '../../shared/enums/review-source.enum';
import { getValidReviewSource } from '../../shared/helpers/get-valid-review-source.function';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('store-reviews')
export class ClientStoreReviewController {

  constructor(
    private readonly storeReviewService: StoreReviewService,
    private moduleRef: ModuleRef
  ) { }

  @Get()
  async getAllReviews(@Query() spf: ClientStoreReviewsSPFDto, @ClientLang() lang: Language): Promise<ResponseDto<ClientStoreReviewDto[]>> {
    const responseDto = await this.storeReviewService.findReviewsByFilters(spf);

    return {
      ...responseDto,
      data: responseDto.data.map(dto => ClientStoreReviewDto.transformToDto(dto, lang))
    }
  }

  @Get('count')
  async getCount(): Promise<ResponseDto<number>> {
    const count = await this.storeReviewService.countEnabledReviews();

    return {
      data: count
    }
  }

  @Get('avg-rating')
  async getAverageRating(): Promise<ResponseDto<number>> {
    const avgRating = await this.storeReviewService.countAverageRating();

    return {
      data: avgRating
    }
  }

  @Get('from-email')
  @Redirect('/')
  async createReviewFromEmail(
    @Query() storeReviewDto: ClientAddStoreReviewFromEmailDto,
    @ClientLang() lang: Language
  ) {
    await this.storeReviewService.createReview({ ...storeReviewDto, source: ReviewSource.Email }, lang);

    return {
      url: `/otzyvy?review-from-email=true`
    };
  }

  @Post('media')
  async uploadMedia(
    @Request() request: FastifyRequest,
    @Response() reply: FastifyReply<ServerResponse>,
    @ClientLang() lang: Language
  ) {
    const media = await this.storeReviewService.uploadMedia(request);
    const mediaDto = ClientMediaDto.transformToDto(media, lang);

    reply.status(201).send(mediaDto);
  }

  @Post()
  async createStoreReview(
    @Req() req,
    @Body() storeReviewDto: ClientAddStoreReviewDto,
    @ClientLang() lang: Language
  ): Promise<ResponseDto<ClientStoreReviewDto>> {

    const authService = this.moduleRef.get(AuthService, { strict: false });
    const customerId = await authService.getCustomerIdFromReq(req);

    const multilangMedias = storeReviewDto.medias.map(media => {
      const multilang = new MultilingualText();
      multilang[lang] = media.altText;
      return {
        ...media,
        altText: multilang
      };
    });

    const review = await this.storeReviewService.createReview({
      ...storeReviewDto,
      medias: multilangMedias as AdminMediaDto[],
      customerId
    }, lang);

    return {
      data: ClientStoreReviewDto.transformToDto(review, lang)
    }
  }

  @Post(':id/vote')
  async createVote(
    @Req() req,
    @Param('id') reviewId: string,
    @IpAddress() ipAddress: string | null,
    @ClientId() clientId: string,
    @ClientLang() lang: Language
  ): Promise<ResponseDto<boolean>> {

    const authService = this.moduleRef.get(AuthService, { strict: false });
    const customerId = await authService.getCustomerIdFromReq(req);
    await this.storeReviewService.createVote(parseInt(reviewId), ipAddress, clientId, customerId, lang);

    return {
      data: true
    }
  }

  @Post(':id/downvote')
  async removeVote(
    @Req() req,
    @Param('id') reviewId: string,
    @IpAddress() ipAddress: string | null,
    @ClientId() clientId: string,
    @ClientLang() lang: Language
  ): Promise<ResponseDto<boolean>> {

    const authService = this.moduleRef.get(AuthService, { strict: false });
    const customerId = await authService.getCustomerIdFromReq(req);

    await this.storeReviewService.removeVote(parseInt(reviewId), ipAddress, clientId, customerId, lang);
    return {
      data: true
    };
  }
}
