import { Injectable } from '@nestjs/common';
import { BaseService } from '../shared/base.service';
import { Product } from './models/product.model';
import { InjectModel } from '@nestjs/mongoose';
import { InstanceType, ModelType } from 'typegoose';
import { InventoryService } from '../inventory/inventory.service';
import { ProductDto } from '../../../shared/dtos/product.dto';
import { Types } from 'mongoose';
import { PageRegistryService } from '../page-registry/page-registry.service';

@Injectable()
export class ProductService extends BaseService<Product> {

  constructor(@InjectModel(Product.modelName) _productModel: ModelType<Product>,
              private readonly inventoryService: InventoryService,
              private readonly pageRegistryService: PageRegistryService) {
    super();
    this._model = _productModel;
  }

  async createProduct(product: ProductDto): Promise<Product> {

    const newProduct = Product.createModel();

    Object.keys(product).forEach(key => {
      newProduct[key] = product[key];
    });

    await this.inventoryService.createInventory(newProduct.sku, newProduct._id, product.qty);

    const result = await this.create(newProduct);
    if (!result) {
      return;
    }

    this.createProductPageRegistry(product.slug);
    return result.toJSON();
  }

  async updateProduct(product: InstanceType<Product>, productDto: ProductDto) {
    const oldSlug = product.slug;

    if (productDto.qty !== undefined) {
      await this.inventoryService.setInventoryQty(product.sku, productDto.qty);
    }

    Object.keys(productDto).forEach(key => {
      product[key] = productDto[key];
    });

    const updated = await this._model.findOneAndUpdate(
      { _id: product.id },
      product,
      { new: true }
    ).exec();

    if (!updated) {
      return;
    }

    this.updateProductPageRegistry(oldSlug, product.slug);
    return updated;
  }

  async deleteProduct(productId: Types.ObjectId) {
    await this.inventoryService.deleteOne({ 'productId': productId });

    const deleted = await this.deleteOne({ '_id': productId });

    if (!deleted) {
      return;
    }

    this.deleteProductPageRegistry(deleted.slug);
    return deleted;
  }

  private createProductPageRegistry(slug: string) {
    return this.pageRegistryService.createPageRegistry({
      slug,
      type: 'product'
    });
  }

  private updateProductPageRegistry(oldSlug: string, newSlug: string) {
    return this.pageRegistryService.updatePageRegistry(oldSlug, {
      slug: newSlug,
      type: 'product'
    });
  }

  private deleteProductPageRegistry(slug: string) {
    return this.pageRegistryService.deletePageRegistry(slug);
  }
}
