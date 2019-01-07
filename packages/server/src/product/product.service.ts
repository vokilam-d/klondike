import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseService } from '../shared/base.service';
import { Product } from './models/product.model';
import { InjectModel } from '@nestjs/mongoose';
import { ModelType } from 'typegoose';
import { IProduct } from '../../../shared/models/product.interface';

@Injectable()
export class ProductService extends BaseService<Product> {

  constructor(@InjectModel(Product.modelName) _productModel: ModelType<Product>) {
    super();
    this._model = _productModel;
  }

  async createProduct(product: IProduct): Promise<Product> {

    const newProduct = Product.createModel();

    Object.keys(product).forEach(key => {
      newProduct[key] = product[key];
    });

    try {
      const result = await this.create(newProduct);
      return result.toJSON();
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }

  }
}
