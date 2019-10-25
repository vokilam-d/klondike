import { Injectable } from '@nestjs/common';
import { Counter } from './counter.model';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';

@Injectable()
export class CounterService {

  constructor(@InjectModel(Counter.name) private readonly counterModel: ReturnModelType<typeof Counter>) {
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
