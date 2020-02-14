import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './models/product.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { InventoryService } from '../inventory/inventory.service';
import { PageRegistryService } from '../page-registry/page-registry.service';
import { InjectModel } from '@nestjs/mongoose';
import { AdminAddOrUpdateProductDto, AdminProductDto } from '../shared/dtos/admin/product.dto';
import { CounterService } from '../shared/counter/counter.service';
import { FastifyRequest } from 'fastify';
import { MediaService } from '../shared/media-uploader/media-uploader/media.service';
import { Media } from '../shared/models/media.model';
import { MediaDto } from '../shared/dtos/admin/media.dto';
import { AdminSortingPaginatingFilterDto } from '../shared/dtos/admin/filter.dto';
import { Inventory } from '../inventory/models/inventory.model';
import { getPropertyOf } from '../shared/helpers/get-property-of.function';
import { ClientSession } from 'mongoose';
import { AdminProductVariantDto } from '../shared/dtos/admin/product-variant.dto';
import { ProductReview } from '../reviews/product-review/models/product-review.model';
import { ProductReviewService } from '../reviews/product-review/product-review.service';
import { ProductVariant } from './models/product-variant.model';

@Injectable()
export class ProductService {

  constructor(@InjectModel(Product.name) private readonly productModel: ReturnModelType<typeof Product>,
              private readonly inventoryService: InventoryService,
              private readonly counterService: CounterService,
              private readonly mediaService: MediaService,
              @Inject(forwardRef(() => ProductReviewService)) private readonly productReviewService: ProductReviewService,
              private readonly pageRegistryService: PageRegistryService) {
  }

  async getAllProductsWithQty(sortingPaginating: AdminSortingPaginatingFilterDto = new AdminSortingPaginatingFilterDto()): Promise<AdminProductDto[]> {
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

  async getProductWithQtyById(id: number): Promise<AdminProductDto> {
    const variantsProp = getPropertyOf<Product>('variants');
    const skuProp = getPropertyOf<Inventory>('sku');
    const qtyProp = getPropertyOf<Inventory>('qty');

    const aggregation = await this.productModel.aggregate()
      .match({ _id: id })
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

  async getProductWithQtyBySku(sku: string): Promise<AdminProductDto> {
    const variantsProp = getPropertyOf<Product>('variants');
    const skuProp = getPropertyOf<Inventory>('sku');
    const qtyProp = getPropertyOf<Inventory>('qty');

    const aggregation = await this.productModel.aggregate()
      .match({ [variantsProp + '.' + skuProp]: sku })
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
      throw new NotFoundException(`Product with sku '${sku}' not found`);
    }

    return found;
  }

  async createProduct(productDto: AdminAddOrUpdateProductDto, migrate?: any): Promise<Product> {
    const session = await this.productModel.db.startSession();
    session.startTransaction();

    try {
      const tmpMedias: MediaDto[] = [];

      const newProductModel = new this.productModel(productDto);
      if (!migrate) {
        newProductModel.id = await this.counterService.getCounter(Product.collectionName);
      }

      for (const dtoVariant of productDto.variants) {
        const savedVariant = newProductModel.variants.find(v => v.sku === dtoVariant.sku);
        const { tmpMedias: checkedTmpMedias, savedMedias } = await this.mediaService.checkTmpAndSaveMedias(dtoVariant.medias, Product.collectionName);

        savedVariant.medias = savedMedias;
        tmpMedias.push(...checkedTmpMedias);

        await this.inventoryService.createInventory(dtoVariant.sku, newProductModel.id, dtoVariant.qty, session);
        await this.createProductPageRegistry(dtoVariant.slug, session);
      }

      await newProductModel.save({ session });
      await session.commitTransaction();

      await this.mediaService.deleteTmpMedias(tmpMedias, Product.collectionName);

      const converted = newProductModel.toJSON();
      converted.variants.forEach(variant => {
        const variantDto = productDto.variants.find(variantDto => variantDto.sku === variantDto.sku);
        variant.qty = variantDto.qty;
      });
      return converted;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async updateProduct(productId: number, productDto: AdminAddOrUpdateProductDto): Promise<Product> {
    const found = await this.productModel.findById(productId).exec();
    if (!found) {
      throw new NotFoundException(`Product with id '${productId}' not found`);
    }

    const session = await this.productModel.db.startSession();
    session.startTransaction();

    try {
      const mediasToDelete: Media[] = [];
      const tmpMedias: MediaDto[] = [];

      const variantsToUpdate: AdminProductVariantDto[] = [];
      const variantsToAdd: AdminProductVariantDto[] = [];
      productDto.variants.forEach(variantDto => {
        if (variantDto.id) {
          variantsToUpdate.push(variantDto);
        } else {
          variantsToAdd.push(variantDto);
        }
      });

      for (const variantDto of variantsToAdd) {
        const { tmpMedias: checkedTmpMedias, savedMedias } = await this.mediaService.checkTmpAndSaveMedias(variantDto.medias, Product.collectionName);
        variantDto.medias = savedMedias;
        tmpMedias.push(...checkedTmpMedias);

        await this.inventoryService.createInventory(variantDto.sku, found.id, variantDto.qty, session);
        await this.createProductPageRegistry(variantDto.slug, session);
      }

      for (const variant of found.variants) {
        const variantInDto = variantsToUpdate.find(variantDto => variant._id.equals(variantDto.id));
        if (!variantInDto) {
          mediasToDelete.push(...variant.medias);
          await this.deleteProductPageRegistry(variant.slug, session);
          await this.inventoryService.deleteInventory(variant.sku, session);
          continue;
        }

        for (const media of variant.medias) {
          const isMediaInDto = variantInDto.medias.find(dtoMedia => dtoMedia.variantsUrls.original === media.variantsUrls.original);
          if (!isMediaInDto) {
            mediasToDelete.push(media);
          }
        }

        const { tmpMedias: checkedTmpMedias, savedMedias } = await this.mediaService.checkTmpAndSaveMedias(variantInDto.medias, Product.collectionName);
        variantInDto.medias = savedMedias;
        tmpMedias.push(...checkedTmpMedias);

        if (variant.slug !== variantInDto.slug) {
          await this.updateProductPageRegistry(variant.slug, variantInDto.slug, session);
        }
        await this.inventoryService.updateInventory(variant.sku, variantInDto.sku, variantInDto.qty, session);
      }

      Object.keys(productDto).forEach(key => { found[key] = productDto[key]; });
      await found.save({ session });
      await session.commitTransaction();
      await this.mediaService.deleteSavedMedias(mediasToDelete, Product.collectionName);
      await this.mediaService.deleteTmpMedias(tmpMedias, Product.collectionName);

      const converted = found.toJSON();
      converted.variants.forEach(variant => {
        const variantDto = productDto.variants.find(variantDto => variantDto.sku === variant.sku);
        variant.qty = variantDto.qty;
      });
      return converted;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async deleteProduct(productId: number): Promise<Product> {
    const session = await this.productModel.db.startSession();
    session.startTransaction();

    try {
      const deleted = await this.productModel.findByIdAndDelete(productId).exec();
      if (!deleted) {
        throw new NotFoundException(`No product found with id '${productId}'`);
      }

      const mediasToDelete: Media[] = [];
      for (const variant of deleted.variants) {
        await this.inventoryService.deleteInventory(variant.sku, session);
        await this.deleteProductPageRegistry(variant.slug, session);
        mediasToDelete.push(...variant.medias);
      }

      await this.productReviewService.deleteReviewsByProductId(productId, session);

      await session.commitTransaction();
      await this.mediaService.deleteSavedMedias(mediasToDelete, Product.collectionName);

      return deleted;
    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  uploadMedia(request: FastifyRequest): Promise<Media> {
    return this.mediaService.upload(request, Product.collectionName);
  }

  getProductsByCategoryId(categoryId: number) {
    return this.productModel.find(
      {
        categoryIds: categoryId
      },
    ).exec();
  }

  private createProductPageRegistry(slug: string, session: ClientSession) {
    return this.pageRegistryService.createPageRegistry({
      slug,
      type: 'product'
    }, session);
  }

  private updateProductPageRegistry(oldSlug: string, newSlug: string, session: ClientSession) {
    return this.pageRegistryService.updatePageRegistry(oldSlug, {
      slug: newSlug,
      type: 'product'
    }, session);
  }

  private deleteProductPageRegistry(slug: string, session: ClientSession) {
    return this.pageRegistryService.deletePageRegistry(slug, session);
  }

  async countProducts(): Promise<number> {
    return this.productModel.estimatedDocumentCount().exec();
  }

  async updateCounter() {
    const lastProduct = await this.productModel.findOne().sort('-_id').exec();
    return this.counterService.setCounter(Product.collectionName, lastProduct.id);
  }

  async addReviewToProduct(review: ProductReview, session?: ClientSession): Promise<any> {
    const conditions: Partial<Product> = { _id: review.productId };
    const countProp = getPropertyOf<Product>('reviewsCount');
    const ratingProp = getPropertyOf<Product>('reviewsAvgRating');

    return this.productModel
      .updateOne(
        conditions,
        [
          { $set: { [countProp]: { $toInt: { $add: [ `$${countProp}`, 1 ] } } } },
          {
            $set: {
              [ratingProp]: {
                $ifNull: [
                  { $divide: [{ $add: [`$${ratingProp}`, review.rating] }, 2] },
                  review.rating
                ]
              }
            }
          }
        ]
      )
      .session(session)
      .exec();
  }

  async removeReviewFromProduct(review: ProductReview, session?: ClientSession): Promise<any> {
    const conditions: Partial<Product> = { _id: review.productId };
    const countProp = getPropertyOf<Product>('reviewsCount');
    const ratingProp = getPropertyOf<Product>('reviewsAvgRating');

    return this.productModel
      .updateOne(
        conditions,
        [
          { $set: { [countProp]: { $toInt: { $subtract: [ `$${countProp}`, 1 ] } } } },
          {
            $set: {
              [ratingProp]: {
                $cond: {
                  if: { $lte: [`$${countProp}`, 0]},
                  then: null,
                  else: { $subtract: [{ $multiply: [`$${ratingProp}`, 2] }, review.rating] }
                }
              }
            }
          }
        ]
      )
      .session(session)
      .exec();
  }

  async incrementSalesCount(productId: number, variantId: string, count: number, session: ClientSession): Promise<any> {
    const conditions: Partial<Product> = { _id: productId, variants: variantId as any };
    const variantsProp = getPropertyOf<Product>('variants');
    const countProp = getPropertyOf<ProductVariant>('salesCount');

    return this.productModel
      .updateOne(
        conditions,
        { $inc: { [`${variantsProp}.$.${countProp}`]: count } }
      )
      .session(session)
      .exec();
  }

  async removeCategoryId(categoryId: number, session: ClientSession): Promise<any> {
    const conditions: Partial<Product> = { categoryIds: categoryId as any };
    const update: Partial<Product> = { categoryIds: categoryId as any };

    return this.productModel
      .updateMany(
        conditions,
        { $pull: update }
      )
      .session(session)
      .exec();
  }
}
