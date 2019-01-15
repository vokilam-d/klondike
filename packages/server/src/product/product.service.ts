import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseService } from '../shared/base.service';
import { Product } from './models/product.model';
import { InjectModel } from '@nestjs/mongoose';
import { InstanceType, ModelType } from 'typegoose';
import { IProduct } from '../../../shared/models/product.interface';
import { InventoryService } from '../inventory/inventory.service';
import { ProductDto } from '../../../shared/dtos/product.dto';
import { Types } from 'mongoose';

@Injectable()
export class ProductService extends BaseService<Product> {

  constructor(@InjectModel(Product.modelName) _productModel: ModelType<Product>,
              private readonly inventoryService: InventoryService) {
    super();
    this._model = _productModel;
  }

  async createProduct(product: ProductDto): Promise<Product> {

    const newProduct = Product.createModel();

    Object.keys(product).forEach(key => {
      newProduct[key] = product[key];
    });

    await this.inventoryService.createInventory(newProduct.sku, newProduct._id, product.qty);

    try {
      const result = await this.create(newProduct);
      return result.toJSON();
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateProduct(product: InstanceType<Product>, productDto: ProductDto) {

    if (productDto.qty !== undefined) {
      await this.inventoryService.setInventoryQty(product.sku, productDto.qty);
    }

    Object.keys(productDto).forEach(key => {
      product[key] = productDto[key];
    });

    try {
      const updated = await this.update(product.id, product);
      return updated;
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteProduct(productId: Types.ObjectId) {
    try {
      await this.inventoryService.delete({ 'productId': productId });

      const deleted = await this.delete({ '_id': productId });
      return deleted;
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
