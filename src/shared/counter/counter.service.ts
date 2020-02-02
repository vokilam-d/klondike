import { Injectable } from '@nestjs/common';
import { Counter } from './counter.model';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { AdminAddOrUpdateCustomerDto } from '../dtos/admin/customer.dto';
import { ClientSession } from "mongoose";

@Injectable()
export class CounterService {

  constructor(@InjectModel(Counter.name) private readonly counterModel: ReturnModelType<typeof Counter>) {
  }

  async getCounter(collectionName: string, session?: ClientSession): Promise<number> {
    const counter = await this.counterModel
      .findOneAndUpdate(
        { _id: collectionName },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      )
      .session(session)
      .exec();

    return counter.seq;
  }

  async setCounter(collectionName: string, seq: number): Promise<number> {
    const counter = await this.counterModel
      .findOneAndUpdate(
        { _id: collectionName },
        { $set: { seq } },
        { new: true, upsert: true }
      )
      .exec();

    return counter.seq;
  }
}
