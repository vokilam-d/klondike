import { Injectable } from '@nestjs/common';
import { BackendCounter } from './counter.model';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';

@Injectable()
export class BackendCounterService {

  constructor(@InjectModel(BackendCounter.name) private readonly counterModel: ReturnModelType<typeof BackendCounter>) {
  }

  async getCounter(collectionName: string): Promise<number> {
    const counter = await this.counterModel
      .findOneAndUpdate(
        { _id: collectionName },
        { $inc: { seq: 1 } },
        { 'new': true, 'upsert': true }
      )
      .exec();

    return counter.seq;
  }
}
