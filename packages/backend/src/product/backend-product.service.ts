import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BackendProduct } from './models/product.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { BackendInventoryService } from '../inventory/backend-inventory.service';
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

  async getProductById(id: number): Promise<DocumentType<BackendProduct>> {
    const found = await this.productModel.findById(id).exec();
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

  async updateProduct(productId: number, productDto: AdminAddOrUpdateProductDto): Promise<BackendProduct> {
    productDto.slug = productDto.slug === '' ? transliterate(productDto.name) : productDto.slug;

    const found = await this.getProductById(productId);
    const oldSlug = found.slug;

    Object.keys(productDto)
      .filter(key => key !== 'id')
      .forEach(key => {
        found[key] = productDto[key];
      });

    const saved = await found.save();

    if (oldSlug !== productDto.slug) {
      this.updateProductPageRegistry(found.slug, productDto.slug);
    }

    await this.inventoryService.setInventoryQty(saved.sku, productDto.qty);

    return saved.toJSON();
  }

  async getProductQty(product: BackendProduct): Promise<number> {
    const inventory = await this.inventoryService.getInventory(product.sku);
    return inventory.qty;
  }

  async deleteProduct(productId: number): Promise<BackendProduct> {
    const deleted = await this.productModel.findByIdAndDelete(productId).exec();
    if (!deleted) {
      throw new NotFoundException(`No product with id '${productId}'`);
    }

    await this.inventoryService.deleteInventory(productId);
    this.deleteProductPageRegistry(deleted.slug);

    return deleted;
  }






























  // async deleteProduct(productId) {
  //   // await this.inventoryService.deleteInventory(productId);
  //
  //   const deleted = await this.productModel.findOneAndDelete({ '_id': productId }).exec();
  //
  //   if (!deleted) {
  //     throw new NotFoundException(`Product with id '${productId}' not found`);
  //   }
  //
  //   this.deleteProductPageRegistry(deleted.slug);
  //   return deleted;
  // }

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
