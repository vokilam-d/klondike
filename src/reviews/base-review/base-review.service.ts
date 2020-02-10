import { ReturnModelType } from '@typegoose/typegoose';
import { BaseReview, ReviewVote } from './models/base-review.model';
import { MediaService } from '../../shared/media-uploader/media-uploader/media.service';
import { FastifyRequest } from 'fastify';
import { Media } from '../../shared/models/media.model';
import { MediaDto } from '../../shared/dtos/admin/media.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminSortingPaginatingDto } from '../../shared/dtos/admin/filter.dto';
import { BaseReviewDto } from '../../shared/dtos/admin/base-review.dto';
import { ClientSession } from 'mongoose';

export abstract class BaseReviewService<T extends BaseReview, U extends BaseReviewDto> {

  protected abstract collectionName: string;
  protected abstract reviewModel: ReturnModelType<new (...args: any) => T>;
  protected abstract mediaService: MediaService;

  async findAllReviews(sortingPaginating: AdminSortingPaginatingDto = new AdminSortingPaginatingDto(),
                       ipAddress?: string,
                       userId?: string,
                       customerId?: number): Promise<U[]> {

    const reviews = await this.reviewModel
      .find()
      .sort(sortingPaginating.sort)
      .skip(sortingPaginating.skip)
      .limit(sortingPaginating.limit)
      .exec();

    return reviews.map(review => this.transformReviewToDto(review.toJSON(), ipAddress, userId, customerId));
  }

  async findReview(reviewId: string, ipAddress?: string, userId?: string, customerId?: number): Promise<U> {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException(`Review with id '${reviewId}' not found`);
    }

    return this.transformReviewToDto(review.toJSON(), ipAddress, userId, customerId);
  }

  async createReview(reviewDto: U, callback?: (review: T, session: ClientSession) => Promise<any>): Promise<U> {
    const session = await this.reviewModel.db.startSession();
    session.startTransaction();

    try {
      const tmpMedias: MediaDto[] = [];
      const review = new this.reviewModel(reviewDto);

      const { tmpMedias: checkedTmpMedias, savedMedias } = await this.mediaService.checkTmpAndSaveMedias(reviewDto.medias, this.collectionName);
      review.medias = savedMedias;
      tmpMedias.push(...checkedTmpMedias);

      await review.save({ session });
      if (callback) await callback(review, session);
      await session.commitTransaction();
      await this.mediaService.deleteTmpMedias(tmpMedias, this.collectionName);

      return this.transformReviewToDto(review.toJSON());
    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      await session.endSession();
    }
  }

  async updateReview(reviewId: string, reviewDto: U): Promise<U> {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException(`Review with id '${reviewId}' not found`);
    }

    const mediasToDelete: Media[] = [];
    const tmpMedias: MediaDto[] = [];

    for (const media of review.medias) {
      const isMediaInDto = reviewDto.medias.find(dtoMedia => dtoMedia.variantsUrls.original === media.variantsUrls.original);
      if (!isMediaInDto) {
        mediasToDelete.push(media);
      }
    }

    const { tmpMedias: checkedTmpMedias, savedMedias } = await this.mediaService.checkTmpAndSaveMedias(reviewDto.medias, this.collectionName);
    reviewDto.medias = savedMedias;
    tmpMedias.push(...checkedTmpMedias);

    Object.keys(reviewDto).forEach(key => { review[key] = reviewDto[key]; });
    await review.save();

    await this.mediaService.deleteTmpMedias(tmpMedias, this.collectionName);
    await this.mediaService.deleteSavedMedias(mediasToDelete, this.collectionName);

    return this.transformReviewToDto(review.toJSON());
  }

  async deleteReview(reviewId: string, callback?: (review: T, session: ClientSession) => Promise<any>): Promise<U> {
    const session = await this.reviewModel.db.startSession();
    session.startTransaction();

    try {
      const deleted = await this.reviewModel.findByIdAndDelete(reviewId).session(session).exec();
      if (!deleted) { throw new NotFoundException(`No review found with id '${reviewId}'`); }

      if (callback) await callback(deleted, session);
      await session.commitTransaction();

      await this.mediaService.deleteSavedMedias(deleted.medias, this.collectionName);

      return this.transformReviewToDto(deleted.toJSON());
    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      await session.endSession();
    }
  }

  uploadMedia(request: FastifyRequest): Promise<Media> {
    return this.mediaService.upload(request, this.collectionName);
  }

  async createVote(reviewId: number, ipAddress: string, userId: string, customerId: number) {
    const foundReview = await this.reviewModel.findById(reviewId).exec();
    if (!foundReview) {
      throw new NotFoundException(`Review with id '${reviewId}' not found`);
    }

    const alreadyVoted = this.hasVoted(foundReview, ipAddress, userId, customerId);

    if (alreadyVoted) {
      throw new ForbiddenException(`You have already voted for this review`);
    }

    const vote = new ReviewVote();
    vote.ip = ipAddress;
    vote.userId = userId;
    vote.customerId = customerId;
    foundReview.votes.push(vote);

    await foundReview.save();
  }

  abstract transformReviewToDto(review: T, ipAddress?: string, userId?: string, customerId?: number): U;

  async countReviews(): Promise<number> {
    return this.reviewModel.estimatedDocumentCount().exec();
  }

  protected hasVoted(review: T, ipAddress: string, userId: string, customerId: number): boolean {
    return review.votes.some(vote => vote.ip === ipAddress || vote.userId === userId || vote.customerId === customerId);
  }
}
