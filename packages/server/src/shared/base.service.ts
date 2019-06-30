import 'automapper-ts/dist/automapper';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InstanceType, ModelType, Typegoose } from 'typegoose';
import { Types } from 'mongoose';

@Injectable()
export class BaseService<T extends Typegoose> {
  protected _model: ModelType<T>;
  // protected _mapper: AutoMapperJs.AutoMapper;

  // private get modelName(): string {
  //   return this._model.modelName;
  // }
  //
  // private get viewModelName(): string {
  //   return `${this._model.modelName}Vm`;
  // }
  //
  // async map<K>(object: Partial<InstanceType<T>> | Partial<InstanceType<T>>[],
  //              sourceKey: string = this.dbModelName,
  //              destinationKey: string = this.viewModelName
  // ) {
  //   return this._mapper.map(sourceKey, destinationKey, object);
  // }

  async findAll(filter = {}): Promise<InstanceType<T>[]> {
    return this._model.find(filter).exec();
  }

  async findOne(filter = {}, projection = {}): Promise<InstanceType<T>> {
    return this._model.findOne(filter, projection).exec();
  }

  async findById(id: any): Promise<InstanceType<T>> {
    return this._model.findById(id).exec();
  }

  async create(item: InstanceType<T>): Promise<InstanceType<T>> {
    return this._model.create(item);
  }

  async deleteOne(filter: any = {}): Promise<InstanceType<T>> {
    return this._model.findOneAndDelete(filter).exec();
  }

  async deleteMany(filter: any = {}): Promise<any> {
    return this._model.deleteMany(filter).exec();
  }
}