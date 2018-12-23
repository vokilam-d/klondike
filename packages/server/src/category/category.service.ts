import { Injectable } from '@nestjs/common';
import * as got from 'got';
import { BaseService } from '../shared/base.service';
import { Category } from './models/category.model';
import { InjectModel } from '@nestjs/mongoose';
import { ModelType } from 'typegoose';

      // const resp = await got(`https://swapi.co/api/planets?format=json`);

@Injectable()
export class CategoryService extends BaseService<Category> {

  constructor(@InjectModel(Category.modelName) private readonly _categoryModel: ModelType<Category>) {
    super();
    this._model = _categoryModel;
  }

}
