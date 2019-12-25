import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './models/product.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { InventoryService } from '../inventory/inventory.service';
import { PageRegistryService } from '../page-registry/page-registry.service';
import { InjectModel } from '@nestjs/mongoose';
import { AdminAddOrUpdateProductDto, AdminResponseProductDto } from '../shared/dtos/admin/product.dto';
import { CounterService } from '../shared/counter/counter.service';
import { FastifyRequest } from 'fastify';
import { MediaService } from '../shared/media-uploader/media-uploader/media.service';
import { Media } from '../shared/models/media.model';
import { MediaDto } from '../shared/dtos/admin/media.dto';
import { AdminSortingPaginatingDto } from '../shared/dtos/admin/filter.dto';
import { Inventory } from '../inventory/models/inventory.model';
import { getPropertyOf } from '../shared/helpers/get-property-of.function';

@Injectable()
export class ProductService {

  constructor(@InjectModel(Product.name) private readonly productModel: ReturnModelType<typeof Product>,
              private readonly inventoryService: InventoryService,
              private readonly counterService: CounterService,
              private readonly mediaService: MediaService,
              private readonly pageRegistryService: PageRegistryService) {
  }

  async getAllProductsWithQty(sortingPaginating: AdminSortingPaginatingDto = new AdminSortingPaginatingDto()): Promise<AdminResponseProductDto[]> {
    const variantsProp = getPropertyOf<Product>('variants');
    const skuProp = getPropertyOf<Inventory>('sku');
    const qtyProp = getPropertyOf<Inventory>('qty');

    const products = await this.productModel.aggregate()
      .unwind(variantsProp)
      .lookup({
        'from': Inventory.collectionName,
        'let': { [variantsProp]: `$${variantsProp}` },
        'pipeline': [
          { $match: { $expr: { $eq: [ `$${skuProp}`, `$$${variantsProp}.${skuProp}` ] } } },
          { $replaceRoot: { newRoot: { $mergeObjects: [{ [qtyProp]: `$${qtyProp}` }, `$$${variantsProp}`] } }}
        ],
        'as': variantsProp
      })
      .group({ '_id': '$_id', [variantsProp]: { $push: { $arrayElemAt: [`$$ROOT.${variantsProp}`, 0] } }, 'document': { $mergeObjects: '$$ROOT' } })
      .replaceRoot({ $mergeObjects: ['$document', { [variantsProp]: `$${variantsProp}`}] })
      .sort(sortingPaginating.sort)
      .skip(sortingPaginating.skip)
      .limit(sortingPaginating.limit)
      .exec();

    return products;
  }

  async getProductWithQtyById(id: number): Promise<DocumentType<AdminResponseProductDto>> {
    const variantsProp = getPropertyOf<Product>('variants');
    const skuProp = getPropertyOf<Inventory>('sku');
    const qtyProp = getPropertyOf<Inventory>('qty');

    const aggregation = await this.productModel.aggregate()
      .unwind(variantsProp)
      .lookup({
        'from': Inventory.collectionName,
        'let': { [variantsProp]: `$${variantsProp}` },
        'pipeline': [
          { $match: { $expr: { $eq: [ `$${skuProp}`, `$$${variantsProp}.${skuProp}` ] } } },
          { $replaceRoot: { newRoot: { $mergeObjects: [{ [qtyProp]: `$${qtyProp}` }, `$$${variantsProp}`] } }}
        ],
        'as': variantsProp
      })
      .group({ '_id': '$_id', [variantsProp]: { $push: { $arrayElemAt: [`$$ROOT.${variantsProp}`, 0] } }, 'document': { $mergeObjects: '$$ROOT' } })
      .replaceRoot({ $mergeObjects: ['$document', { [variantsProp]: `$${variantsProp}`}] })
      .exec();

    const found = aggregation[0];
    if (!found) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }

    return found;
  }

  async createProduct(productDto: AdminAddOrUpdateProductDto): Promise<Product> {
    const newProductModel = new this.productModel(productDto);
    (newProductModel.id) = await this.counterService.getCounter(Product.collectionName);
    await newProductModel.save();

    for (const dtoVariant of productDto.variants) {
      const savedVariant = newProductModel.variants.find(v => v.sku === dtoVariant.sku);
      savedVariant.medias = await this.checkTmpAndSaveMedias(dtoVariant.medias);

      await this.inventoryService.createInventory(dtoVariant.sku, newProductModel.id, dtoVariant.qty);
      this.createProductPageRegistry(dtoVariant.slug);
    }

    await newProductModel.save();

    return newProductModel.toJSON();
  }

  async updateProduct(productId: number, productDto: AdminAddOrUpdateProductDto): Promise<Product> {
    const found = await this.productModel.findById(productId).exec();
    if (!found) {
      throw new NotFoundException(`Product with id '${productId}' not found`);
    }

    const mediasToDelete: Media[] = [];
    const slugUpdates = new Map<string, string>();

    found.variants.forEach(variant => {
      const variantInDto = productDto.variants.find(dtoVariant => variant.id.equals(dtoVariant.id));
      if (!variantInDto) {
        mediasToDelete.push(...variant.medias);
        return;
      }

      variant.medias.forEach(media => {
        const isMediaInDto = variantInDto.medias.find(dtoMedia => dtoMedia.variantsUrls.original === media.variantsUrls.original);
        if (!isMediaInDto) {
          mediasToDelete.push(media);
        }
      });

      if (variant.slug !== variantInDto.slug) {
        slugUpdates.set(variant.slug, variantInDto.slug);
      }
    });

    Object.keys(productDto).forEach(key => { found[key] = productDto[key]; });
    await found.save();

    for (const variant of found.variants) {
      variant.medias = await this.checkTmpAndSaveMedias(variant.medias);
    }
    await found.save();

    for (const variant of productDto.variants) {
      await this.inventoryService.setInventoryQty(variant.sku, variant.qty);
    }
    for (const [oldSlug, newSlug] of slugUpdates) {
      this.updateProductPageRegistry(oldSlug, newSlug);
    }
    await this.deleteMedias(mediasToDelete);

    return found.toJSON();
  }

  async deleteProduct(productId: number): Promise<Product> {
    const deleted = await this.productModel.findByIdAndDelete(productId).exec();
    if (!deleted) {
      throw new NotFoundException(`No product with id '${productId}'`);
    }

    for (const variant of deleted.variants) {
      await this.inventoryService.deleteInventory(variant.sku);
      await this.deleteMedias(variant.medias);
      this.deleteProductPageRegistry(variant.slug);
    }

    return deleted;
  }

  uploadMedia(request: FastifyRequest): Promise<Media> {
    return this.mediaService.upload(request, Product.collectionName);
  }

  private async checkTmpAndSaveMedias(mediaDtos: MediaDto[]): Promise<Media[]> {
    const medias = [];

    for (let mediaDto of mediaDtos) {
      if (mediaDto.variantsUrls.original.includes('/tmp/')) {
        medias.push(await this.mediaService.saveTmpMedia(Product.collectionName, mediaDto));
      }
    }

    return medias;
  }

  private async deleteMedias(medias: Media[]): Promise<void> {
    for (const media of medias) {
      await this.mediaService.delete(media, Product.collectionName);
    }
  }

  findProductsByCategoryId(categoryId: number) {
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

  async countProducts(): Promise<number> {
    return this.productModel.estimatedDocumentCount().exec();
  }
}
