import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Redirect, Req,
  Request,
  Response,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
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

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('product-reviews')
export class ClientProductReviewController {

  constructor(private readonly productReviewService: ProductReviewService,
              private moduleRef: ModuleRef) {
  }

  @Get()
  async findProductReviews(@Query() query: ClientProductReviewFilterDto,
                           @IpAddress() ipAddress: string | null,
                           @Headers() headers
  ): Promise<ResponseDto<ClientProductReviewDto[]>> {

    const adminDto = await this.productReviewService.findReviewsByProductId(query.productId, true, ipAddress, headers.userId, headers.customerId);

    return {
      data: plainToClass(ClientProductReviewDto, adminDto, { excludeExtraneousValues: true })
    }
  }

  @Get('from-email')
  @Redirect('/')
  async createReviewFromEmail(@Query() productReviewDto: ClientAddProductReviewDto) {
    const productSlug = await this.productReviewService.createReviewFromEmail(productReviewDto);

    return {
      url: `/${productSlug}?review-from-email=true`
    };
  }

  @Post('media')
  async uploadMedia(@Request() request: FastifyRequest, @Response() reply: FastifyReply<ServerResponse>) {
    const media = await this.productReviewService.uploadMedia(request);
    const mediaDto = plainToClass(ClientMediaDto, media, { excludeExtraneousValues: true });

    reply.status(201).send(mediaDto);
  }

  @Post()
  async createProductReview(@Req() req, @Body() productReviewDto: ClientAddProductReviewDto, @Query('migrate') migrate: any): Promise<ResponseDto<ClientProductReviewDto>> {

    if (!productReviewDto.customerId) {
      const authService = this.moduleRef.get(AuthService, { strict: false });
      productReviewDto.customerId = await authService.getCustomerIdFromReq(req);
    }
    const review = await this.productReviewService.createReview(productReviewDto, migrate);

    return {
      data: plainToClass(ClientProductReviewDto, review, { excludeExtraneousValues: true })
    }
  }

  @Post(':id/comment')
  async addComment(@Param('id') reviewId: string, @Req() req, @Body() commentDto: ClientAddProductReviewCommentDto, @Headers() headers): Promise<ResponseDto<ClientProductReviewDto>> {
    const authService = this.moduleRef.get(AuthService, { strict: false });
    const customerId = await authService.getCustomerIdFromReq(req);

    const review = await this.productReviewService.addComment(parseInt(reviewId), commentDto, customerId);
    const adminDto = this.productReviewService.transformReviewToDto(review, undefined, headers.userId, customerId, true);

    return {
      data: plainToClass(ClientProductReviewDto, adminDto, { excludeExtraneousValues: true })
    }
  }

  @Post(':id/vote')
  async createVote(@Req() req, @Param('id') reviewId: string, @IpAddress() ipAddress: string | null, @Headers() headers): Promise<ResponseDto<boolean>> {
    const authService = this.moduleRef.get(AuthService, { strict: false });
    const customerId = await authService.getCustomerIdFromReq(req);

    await this.productReviewService.createVote(parseInt(reviewId), ipAddress, headers.userId, customerId);

    return {
      data: true
    }
  }

  @Post(':id/downvote')
  async removeVote(@Req() req, @Param('id') reviewId: string, @IpAddress() ipAddress: string | null, @Headers() headers): Promise<ResponseDto<boolean>> {
    const authService = this.moduleRef.get(AuthService, { strict: false });
    const customerId = await authService.getCustomerIdFromReq(req);

    await this.productReviewService.removeVote(parseInt(reviewId), ipAddress, headers.userId, customerId);
    return {
      data: true
    }
  }
}
