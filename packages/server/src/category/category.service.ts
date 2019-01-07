import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseService } from '../shared/base.service';
import { Category } from './models/category.model';
import { InjectModel } from '@nestjs/mongoose';
import { ModelType } from 'typegoose';
import { ICategory } from '../../../shared/models/category.interface';

@Injectable()
export class CategoryService extends BaseService<Category> {

  constructor(@InjectModel(Category.modelName) _categoryModel: ModelType<Category>) {
    super();
    this._model = _categoryModel;
  }

  async createCategory(category: ICategory): Promise<Category> {

    const newCategory = Category.createModel();

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
