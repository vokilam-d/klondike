import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BackendProduct } from './models/product.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { BackendInventoryService } from '../inventory/backend-inventory.service';
import { ProductDto } from '../../../shared/dtos/product.dto';
import { BackendPageRegistryService } from '../page-registry/page-registry.service';
import { InjectModel } from '@nestjs/mongoose';
import { AdminAddOrUpdateProductDto } from '../shared/dtos/admin/product.dto';
import { transliterate } from '../shared/helpers/transliterate.function';
import { BackendCounterService } from '../shared/counter/counter.service';

@Injectable()
export class BackendProductService {

  constructor(@InjectModel(BackendProduct.name) private readonly productModel: ReturnModelType<typeof BackendProduct>,
              private readonly inventoryService: BackendInventoryService,
              private readonly counterService: BackendCounterService,
              private readonly pageRegistryService: BackendPageRegistryService) {
  }

  async getProducts(): Promise<BackendProduct[]> {
    const products = await this.productModel.find().exec();

    return products.map(p => p.toJSON());
  }

  async getProductById(id: string): Promise<DocumentType<BackendProduct>> {
    const found = await this.productModel.findById(parseInt(id)).exec();
    if (!found) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }

    return found;
  }

  async createProduct(productDto: AdminAddOrUpdateProductDto): Promise<BackendProduct> {
    productDto.slug = productDto.slug === '' ? transliterate(productDto.name) : productDto.slug;

    const duplicate = await this.productModel.findOne({ slug: productDto.slug }).exec();
    if (duplicate) {
      throw new BadRequestException(`Product with slug '${productDto.slug}' already exists`);
    }

    const newProductModel = new this.productModel(productDto);
    newProductModel.id = await this.counterService.getCounter(BackendProduct.collectionName);
    await newProductModel.save();

    await this.inventoryService.createInventory(newProductModel.sku, newProductModel.id, productDto.qty);
    this.createProductPageRegistry(newProductModel.slug);

    return newProductModel.toJSON();
  }

  async getProductQty(product: BackendProduct): Promise<number> {
    const inventory = await this.inventoryService.getInventory(product.sku);
    return inventory.qty;
  }





























  // async createProduct(product: ProductDto): Promise<BackendProduct> {
  //
  //   const newProduct = new BackendProduct();
  //
  //   Object.keys(product).forEach(key => {
  //     if (key === 'categoryIds') {
  //       newProduct.categoryIds = product.categoryIds.map(id => this.toProductObjectId(id));
  //     } else {
  //       newProduct[key] = product[key];
  //     }
  //   });
  //
  //   const created = await this.productModel.create(newProduct);
  //
  //   await this.inventoryService.createInventory(created.sku, created._id, product.qty);
  //   this.createProductPageRegistry(created.slug);
  //
  //   return created.toJSON();
  // }

  async updateProduct(product: DocumentType<BackendProduct>, productDto: ProductDto) {
    const oldSlug = product.slug;

    if (productDto.qty !== undefined) {
      await this.inventoryService.setInventoryQty(product.sku, productDto.qty);
    }

    Object.keys(productDto).forEach(key => {
      product[key] = productDto[key];
    });

    const updated = await this.productModel.findOneAndUpdate(
      { _id: product.id },
      product,
      { new: true }
    ).exec();

    this.updateProductPageRegistry(oldSlug, product.slug);
    return updated;
  }

  async deleteProduct(productId) {
    // await this.inventoryService.deleteOne(productId);

    const deleted = await this.productModel.findOneAndDelete({ '_id': productId }).exec();

    if (!deleted) {
      throw new NotFoundException(`Product with id '${productId}' not found`);
    }

    this.deleteProductPageRegistry(deleted.slug);
    return deleted;
  }

  findAll(query) {
    return this.productModel.find().exec();
  }

  findOne(filter = {}) {
    return this.productModel.findOne(filter).exec();
  }

  async findById(id: any) {
    return this.productModel.findById(id).exec();
  }

  findProductsByCategoryId(categoryId: number, filter: any = {}) {
    return this.productModel.find(
      {
        categoryIds: categoryId
      },
    ).exec();
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

  toProductObjectId(productId: any): any {
    return;
  }
}
