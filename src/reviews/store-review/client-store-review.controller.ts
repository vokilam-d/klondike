import { Body, Controller, Get, Headers, Param, Post, Query, Req, Request, Response } from '@nestjs/common';
import { StoreReviewService } from './store-review.service';
import { IpAddress } from '../../shared/decorators/ip-address.decorator';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { AuthService } from '../../auth/services/auth.service';
import { ModuleRef } from '@nestjs/core';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from "http";
import { plainToClass } from 'class-transformer';
import { ClientMediaDto } from '../../shared/dtos/client/media.dto';
import { ClientAddStoreReviewDto } from '../../shared/dtos/client/add-store-review.dto';
import { ClientStoreReviewDto } from '../../shared/dtos/client/store-review.dto';

@Controller('store-reviews')
export class ClientStoreReviewController {

  constructor(private readonly storeReviewService: StoreReviewService,
              private moduleRef: ModuleRef) {
  }

  @Get()
  async getAllReviews(): Promise<ResponseDto<ClientStoreReviewDto[]>> {
    const reviews = await this.storeReviewService.findAllReviews(true);

    return {
      data: plainToClass(ClientStoreReviewDto, reviews, { excludeExtraneousValues: true })
    }
  }

  @Get('count')
  async getCount(): Promise<ResponseDto<number>> {
    const count = await this.storeReviewService.countEnabledReviews();

    return {
      data: count
    }
  }

  @Post('media')
  async uploadMedia(@Request() request: FastifyRequest, @Response() reply: FastifyReply<ServerResponse>) {
    const media = await this.storeReviewService.uploadMedia(request);
    const mediaDto = plainToClass(ClientMediaDto, media, { excludeExtraneousValues: true });

    reply.status(201).send(mediaDto);
  }

  @Post()
  async createStoreReview(@Req() req, @Body() storeReviewDto: ClientAddStoreReviewDto, @Query('migrate') migrate: any): Promise<ResponseDto<ClientStoreReviewDto>> {

    const authService = this.moduleRef.get(AuthService, { strict: false });
    const customerId = await authService.getCustomerIdFromReq(req);
    const review = await this.storeReviewService.createReview({ ...storeReviewDto, customerId }, migrate);

    return {
      data: plainToClass(ClientStoreReviewDto, review, { excludeExtraneousValues: true })
    }
  }

  @Post(':id/vote')
  async createVote(@Req() req, @Param('id') reviewId: string, @IpAddress() ipAddress: string | null, @Headers() headers): Promise<ResponseDto<boolean>> {
    const authService = this.moduleRef.get(AuthService, { strict: false });
    const customerId = await authService.getCustomerIdFromReq(req);
    await this.storeReviewService.createVote(parseInt(reviewId), ipAddress, headers.userId, customerId);

    return {
      data: true
    }
  }

  @Post(':id/downvote')
  async removeVote(@Req() req, @Param('id') reviewId: string, @IpAddress() ipAddress: string | null, @Headers() headers): Promise<ResponseDto<boolean>> {
    const authService = this.moduleRef.get(AuthService, { strict: false });
    const customerId = await authService.getCustomerIdFromReq(req);

    await this.storeReviewService.removeVote(parseInt(reviewId), ipAddress, headers.userId, customerId);
    return {
      data: true
    }
  }
}
