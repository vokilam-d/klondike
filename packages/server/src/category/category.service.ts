import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseService } from '../shared/base.service';
import { Category } from './models/category.model';
import { InjectModel } from '@nestjs/mongoose';
import { ModelType } from 'typegoose';
import { ICategory } from '../../../shared/models/category.interface';
import { CounterService } from '../shared/counter/counter.service';

@Injectable()
export class CategoryService extends BaseService<Category> {

  constructor(@InjectModel(Category.modelName) private readonly _categoryModel: ModelType<Category>,
              private readonly counterService: CounterService) {
    super();
    this._model = _categoryModel;
  }

  async createCategory(category: ICategory): Promise<Category> {

    let newCategory = Category.createModel();

    try {
      newCategory._id = await this.counterService.getCounter(Category.collectionName);
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    Object.keys(category).forEach(key => {
      newCategory[key] = category[key];
    });

    try {
      const result = await this.create(newCategory);
      return result.toJSON();
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
