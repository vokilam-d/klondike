import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseService } from '../base.service';
import { Counter } from './counter.model';
import { InjectModel } from '@nestjs/mongoose';
import { ModelType } from 'typegoose';

@Injectable()
export class CounterService extends BaseService<Counter> {

  constructor(@InjectModel(Counter.modelName) private readonly _counterModel: ModelType<Counter>) {
    super();
    this._model = this._counterModel;
  }

  async getCounter(collectionName: string): Promise<number> {
    try {
      const counter = await this._model
        .findOneAndUpdate(
          { _id: collectionName },
          { $inc: { seq: 1 } },
          { 'new': true, 'upsert': true }
        )
        .exec();

      return counter.seq;

    } catch (ex) {
      throw new HttpException(ex, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
