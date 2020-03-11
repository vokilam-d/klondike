import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { BaseReview, ReviewVote } from './models/base-review.model';
import { FastifyRequest } from 'fastify';
import { Media } from '../../shared/models/media.model';
import { AdminMediaDto } from '../../shared/dtos/admin/media.dto';
import { ForbiddenException, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { AdminSortingPaginatingFilterDto } from '../../shared/dtos/admin/spf.dto';
import { AdminBaseReviewDto } from '../../shared/dtos/admin/base-review.dto';
import { ClientSession } from 'mongoose';
import { CounterService } from '../../shared/counter/counter.service';
import { MediaService } from '../../shared/media-service/media.service';
import { SearchService } from '../../shared/search/search.service';
import { ResponseDto } from '../../shared/dtos/shared/response.dto';

type IReviewCallback<T = any> = (review: T, session: ClientSession) => Promise<any>;

interface IUpdateReviewCallbacks<T = any> {
  onEnable?: IReviewCallback<T>;
  onDisable?: IReviewCallback<T>;
}

export abstract class BaseReviewService<T extends BaseReview, U extends AdminBaseReviewDto> implements OnApplicationBootstrap {

  protected abstract collectionName: string;
  protected abstract ElasticReview: new () => any;
  protected abstract reviewModel: ReturnModelType<new (...args: any) => T>;
  protected abstract mediaService: MediaService;
  protected abstract counterService: CounterService;
  protected abstract searchService: SearchService;


  onApplicationBootstrap(): any {
    this.searchService.ensureCollection(this.collectionName, new this.ElasticReview());
  }

  async getReviewsResponse(spf: AdminSortingPaginatingFilterDto,
                           ipAddress?: string,
                           userId?: string,
                           customerId?: number): Promise<ResponseDto<U[]>> {

    let itemsFiltered: number;
    let reviews: U[];

    if (spf.hasFilters()) {
      const searchResponse = await this.searchByFilters(spf);
      reviews = searchResponse[0];
      itemsFiltered = searchResponse[1];
    } else {
      const reviewModels = await this.reviewModel
        .find()
        .sort(spf.getSortAsObj(true))
        .skip(spf.skip)
        .limit(spf.limit)
        .exec();

      reviews = reviewModels.map(review => this.transformReviewToDto(review, ipAddress, userId, customerId));
    }

    const itemsTotal = await this.countReviews();
    const pagesTotal = Math.ceil(itemsTotal / spf.limit);
    return {
      data: reviews,
      itemsTotal,
      itemsFiltered,
      pagesTotal
    };
  }

  async findReview(reviewId: string, ipAddress?: string, userId?: string, customerId?: number): Promise<U> {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException(`Review with id '${reviewId}' not found`);
    }

    return this.transformReviewToDto(review, ipAddress, userId, customerId);
  }

  async createReview(reviewDto: U, callback?: IReviewCallback<T>, migrate?): Promise<U> {
    const session = await this.reviewModel.db.startSession();
    session.startTransaction();

    try {
      const tmpMedias: AdminMediaDto[] = [];
      const review = new this.reviewModel(reviewDto);
      if (!migrate) {
        review.id = await this.counterService.getCounter(this.collectionName, session);
      }

      const { tmpMedias: checkedTmpMedias, savedMedias } = await this.mediaService.checkTmpAndSaveMedias(reviewDto.medias, this.collectionName);
      review.medias = savedMedias;
      tmpMedias.push(...checkedTmpMedias);

      await review.save({ session });
      if (review.isEnabled && callback) { await callback(review, session); }
      await session.commitTransaction();

      this.addSearchData(review);
      await this.mediaService.deleteTmpMedias(tmpMedias, this.collectionName);

      return this.transformReviewToDto(review);
    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      await session.endSession();
    }
  }

  async updateReview(reviewId: string, reviewDto: U, { onEnable, onDisable }: IUpdateReviewCallbacks = {}): Promise<U> {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException(`Review with id '${reviewId}' not found`);
    }

    const session = await this.reviewModel.db.startSession();
    session.startTransaction();

    try {
      const mediasToDelete: Media[] = [];
      const tmpMedias: AdminMediaDto[] = [];

      for (const media of review.medias) {
        const isMediaInDto = reviewDto.medias.find(dtoMedia => dtoMedia.variantsUrls.original === media.variantsUrls.original);
        if (!isMediaInDto) {
          mediasToDelete.push(media);
        }
      }

      const { tmpMedias: checkedTmpMedias, savedMedias } = await this.mediaService.checkTmpAndSaveMedias(reviewDto.medias, this.collectionName);
      reviewDto.medias = savedMedias;
      tmpMedias.push(...checkedTmpMedias);

      if (onEnable && reviewDto.isEnabled === true && review.isEnabled === false) {
        await onEnable(review, session);
      } else if (onDisable && reviewDto.isEnabled === false && review.isEnabled === true) {
        await onDisable(review, session);
      }

      Object.keys(reviewDto).forEach(key => { review[key] = reviewDto[key]; });
      await review.save({ session });
      await session.commitTransaction();

      this.updateSearchData(review);
      await this.mediaService.deleteTmpMedias(tmpMedias, this.collectionName);
      await this.mediaService.deleteSavedMedias(mediasToDelete, this.collectionName);

      return this.transformReviewToDto(review);
    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      await session.endSession();
    }
  }

  async deleteReview(reviewId: string, callback?: IReviewCallback<T>): Promise<U> {
    const session = await this.reviewModel.db.startSession();
    session.startTransaction();

    try {
      const deleted = await this.reviewModel.findByIdAndDelete(reviewId).session(session).exec();
      if (!deleted) { throw new NotFoundException(`No review found with id '${reviewId}'`); }

      if (deleted.isEnabled && callback) { await callback(deleted, session) };
      await session.commitTransaction();

      await this.mediaService.deleteSavedMedias(deleted.medias, this.collectionName);
      this.deleteSearchData(deleted);

      return this.transformReviewToDto(deleted);
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
      throw new ForbiddenException(`Вы уже голосовали за этот отзыв`);
    }

    const vote = new ReviewVote();
    vote.ip = ipAddress;
    vote.userId = userId;
    vote.customerId = customerId;
    foundReview.votes.push(vote);

    await foundReview.save();
    this.updateSearchData(foundReview);
  }

  async removeVote(reviewId: number, ipAddress: string, userId: string, customerId: number) {
    const foundReview = await this.reviewModel.findById(reviewId).exec();
    if (!foundReview) {
      throw new NotFoundException(`Review with id '${reviewId}' not found`);
    }

    const alreadyVoted = this.hasVoted(foundReview, ipAddress, userId, customerId);

    if (alreadyVoted) {
      throw new ForbiddenException(`You have already voted for this review`);
    }

    foundReview.votes.pop();

    await foundReview.save();
    this.updateSearchData(foundReview);
  }

  abstract transformReviewToDto(review: DocumentType<T>, ipAddress?: string, userId?: string, customerId?: number): U;

  async countReviews(): Promise<number> {
    return this.reviewModel.estimatedDocumentCount().exec();
  }

  protected hasVoted(review: T, ipAddress: string, userId: string, customerId: number): boolean {
    return review.votes.some(vote => {
      const ipHit = vote.ip && vote.ip === ipAddress;
      const userIdHit = vote.userId && vote.userId === userId;
      const customerIdHit = vote.customerId && vote.customerId === customerId;

      return ipHit || userIdHit || customerIdHit;
    });
  }

  async updateCounter() {
    const lastReview = await this.reviewModel.findOne().sort('-_id').exec();
    return this.counterService.setCounter(this.collectionName, lastReview.id);
  }

  private async addSearchData(review: DocumentType<T>) {
    const reviewDto = this.transformReviewToDto(review);
    await this.searchService.addDocument(this.collectionName, review.id, reviewDto);
  }

  private updateSearchData(review: DocumentType<T>): Promise<any> {
    const reviewDto = this.transformReviewToDto(review);
    return this.searchService.updateDocument(this.collectionName, review.id, reviewDto);
  }

  private deleteSearchData(review: DocumentType<T>): Promise<any> {
    return this.searchService.deleteDocument(this.collectionName, review.id);
  }

  private async searchByFilters(spf: AdminSortingPaginatingFilterDto) {
    return this.searchService.searchByFilters<U>(
      this.collectionName,
      spf.getNormalizedFilters(),
      spf.skip,
      spf.limit
    );
  }
}
