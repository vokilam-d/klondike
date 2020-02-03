import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AddOrUpdateStoreReviewDto } from '../shared/dtos/admin/store-review.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { StoreReview, StoreReviewVote } from './models/store-review.model';
import { CounterService } from '../shared/counter/counter.service';

@Injectable()
export class StoreReviewService {

  constructor(@InjectModel(StoreReview.name) private readonly storeReviewModel: ReturnModelType<typeof StoreReview>,
              private readonly counterService: CounterService) {
  }

  async createStoreReview(storeReviewDto: AddOrUpdateStoreReviewDto) {
    const session = await this.storeReviewModel.db.startSession();
    session.startTransaction();

    try {
      const storeReview = new this.storeReviewModel(storeReviewDto);
      storeReview.id = this.counterService.getCounter(StoreReview.collectionName, session);

      await storeReview.save({ session });
      await session.commitTransaction();

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async createVote(reviewId: number, ipAddress: string, userId: string, customerId: string) {
    const foundReview = await this.storeReviewModel.findById(reviewId).exec();
    if (!foundReview) {
      throw new NotFoundException(`Store review with id ${reviewId} not found`);
    }

    const alreadyVoted = foundReview.votes.some(vote => vote.ip === ipAddress
      || vote.userId === userId
      || vote.customerId === customerId
    );
    if (alreadyVoted) {
      throw new ForbiddenException(`You have already voted for this review`);
    }

    const vote = new StoreReviewVote();
    vote.ip = ipAddress;
    vote.userId = userId;
    vote.customerId = customerId;
    foundReview.votes.push(vote);

    await foundReview.save();
  }
}
