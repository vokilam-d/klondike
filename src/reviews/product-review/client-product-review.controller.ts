import { Body, Controller, Get, Param, Post, Query, Redirect, Req, Request, Response, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductReviewService } from './product-review.service';
import { ClientProductReviewFilterDto } from '../../shared/dtos/client/product-review-filter.dto';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { ClientProductReviewDto } from '../../shared/dtos/client/product-review.dto';
import { IpAddress } from '../../shared/decorators/ip-address.decorator';
import { plainToClass } from 'class-transformer';
import { ClientAddProductReviewCommentDto } from '../../shared/dtos/client/product-review-comment.dto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';
import { ClientMediaDto } from '../../shared/dtos/client/media.dto';
import { ClientAddProductReviewDto } from '../../shared/dtos/client/add-product-review.dto';
import { ModuleRef } from '@nestjs/core';
import { AuthService } from '../../auth/services/auth.service';
import { ClientId } from '../../shared/decorators/client-id.decorator';
import { ClientLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';
import { MultilingualText } from '../../shared/models/multilingual-text.model';
import { AdminMediaDto } from '../../shared/dtos/admin/media.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('product-reviews')
export class ClientProductReviewController {

  constructor(
    private readonly productReviewService: ProductReviewService,
    private readonly moduleRef: ModuleRef
  ) { }

  @Get()
  async findProductReviews(
    @Query() query: ClientProductReviewFilterDto,
    @Req() req,
    @IpAddress() ipAddress: string | null,
    @ClientId() clientId: string,
    @ClientLang() lang: Language
  ): Promise<ResponseDto<ClientProductReviewDto[]>> {

    const authService = this.moduleRef.get(AuthService, { strict: false });
    const customerId = await authService.getCustomerIdFromReq(req);

    const adminDto = await this.productReviewService.findReviewsByProductId(query.productId, true, ipAddress, clientId, customerId);

    return {
      data: adminDto.map(dto => ClientProductReviewDto.transformToDto(dto, lang))
    }
  }

  @Get('from-email')
  @Redirect('/')
  async createReviewFromEmail(
    @Query() productReviewDto: ClientAddProductReviewDto,
    @ClientLang() lang: Language
  ) {
    const productSlug = await this.productReviewService.createReviewFromEmail(productReviewDto, lang);

    return {
      url: `/${productSlug}?review-from-email=true`
    };
  }

  @Post('media')
  async uploadMedia(
    @Request() request: FastifyRequest,
    @Response() reply: FastifyReply<ServerResponse>,
    @ClientLang() lang: Language
  ) {
    const media = await this.productReviewService.uploadMedia(request);
    const mediaDto = ClientMediaDto.transformToDto(media, lang);

    reply.status(201).send(mediaDto);
  }

  @Post()
  async createProductReview(
    @Req() req,
    @Body() productReviewDto: ClientAddProductReviewDto,
    @ClientLang() lang: Language
  ): Promise<ResponseDto<ClientProductReviewDto>> {

    if (!productReviewDto.customerId) {
      const authService = this.moduleRef.get(AuthService, { strict: false });
      productReviewDto.customerId = await authService.getCustomerIdFromReq(req);
    }

    const multilangMedias = productReviewDto.medias.map(media => {
      const multilang = new MultilingualText();
      multilang[lang] = media.altText;
      return {
        ...media,
        altText: multilang
      };
    });

    const review = await this.productReviewService.createReview({ ...productReviewDto, medias: multilangMedias as AdminMediaDto[] }, lang);

    return {
      data: ClientProductReviewDto.transformToDto(review, lang)
    }
  }

  @Post(':id/comment')
  async addComment(
    @Param('id') reviewId: string,
    @Req() req,
    @Body() commentDto: ClientAddProductReviewCommentDto,
    @ClientId() clientId: string,
    @ClientLang() lang: Language
  ): Promise<ResponseDto<ClientProductReviewDto>> {

    const authService = this.moduleRef.get(AuthService, { strict: false });
    const customerId = await authService.getCustomerIdFromReq(req);

    const review = await this.productReviewService.addComment(parseInt(reviewId), commentDto, customerId, lang);
    const adminDto = this.productReviewService.transformReviewToDto(review, undefined, clientId, customerId, true);

    return {
      data: ClientProductReviewDto.transformToDto(adminDto, lang)
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

    await this.productReviewService.createVote(parseInt(reviewId), ipAddress, clientId, customerId, lang);

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

    await this.productReviewService.removeVote(parseInt(reviewId), ipAddress, clientId, customerId, lang);
    return {
      data: true
    }
  }
}
