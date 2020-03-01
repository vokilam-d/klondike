import { forwardRef, Inject, Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { Product } from './models/product.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { InventoryService } from '../inventory/inventory.service';
import { PageRegistryService } from '../page-registry/page-registry.service';
import { InjectModel } from '@nestjs/mongoose';
import { AdminAddOrUpdateProductDto } from '../shared/dtos/admin/product.dto';
import { CounterService } from '../shared/counter/counter.service';
import { FastifyRequest } from 'fastify';
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
import { MediaService } from '../shared/media-service/media.service';
import { CategoryService } from '../category/category.service';
import { ProductBreadcrumb } from './models/product-breadcrumb.model';
import { AdminCategoryTreeItem } from '../shared/dtos/admin/category.dto';
import { SearchService } from '../shared/search/search.service';
import { ResponseDto } from '../shared/dtos/admin/response.dto';
import { AdminProductListItemDto } from '../shared/dtos/admin/product-list-item.dto';
import { ProductWithQty } from './models/product-with-qty.model';
import { AdminProductVariantListItem } from '../shared/dtos/admin/product-variant-list-item.dto';
import { DEFAULT_CURRENCY } from '../shared/enums/currency.enum';
import { ElasticProduct } from './models/elastic-product.model';

type productId = number;
type productVariantId = string;
type ProductListItem = AdminProductListItemDto;

@Injectable()
export class ProductService implements OnApplicationBootstrap {

  private cachedProductCount: number;

  constructor(@InjectModel(Product.name) private readonly productModel: ReturnModelType<typeof Product>,
              private readonly inventoryService: InventoryService,
              private readonly counterService: CounterService,
              private readonly mediaService: MediaService,
              private readonly searchService: SearchService,
              @Inject(forwardRef(() => ProductReviewService)) private readonly productReviewService: ProductReviewService,
              @Inject(forwardRef(() => CategoryService)) private readonly categoryService: CategoryService,
              private readonly pageRegistryService: PageRegistryService) {
  }

  onApplicationBootstrap(): any {
    this.searchService.ensureCollection(Product.collectionName, new ElasticProduct());
  }

  async getProductsList(spf: AdminSortingPaginatingFilterDto = new AdminSortingPaginatingFilterDto(),
                        withVariants: boolean
  ): Promise<ResponseDto<AdminProductListItemDto[]>> {

    let products;
    let itemsFiltered;
    if (spf.hasFilters()) {
      const searchResponse = await this.searchByFilters(spf, withVariants);
      products = searchResponse[0];
      itemsFiltered = searchResponse[1];
    } else {
      products = await this.getProductsWithQty(spf);
      products = this.transformProductsWithQtyToListItemDtos(products, withVariants);
    }
    const itemsTotal = await this.countProducts();

    return {
      data: products,
      page: spf.page,
      pagesTotal: Math.ceil(itemsTotal / spf.limit),
      itemsTotal,
      itemsFiltered
    }
  }

  async getProductsWithQty(sortingPaginating: AdminSortingPaginatingFilterDto = new AdminSortingPaginatingFilterDto()): Promise<ProductWithQty[]> {
    const variantsProp = getPropertyOf<Product>('variants');
    const descProp = getPropertyOf<ProductVariant>('fullDescription');
    const skuProp = getPropertyOf<Inventory>('sku');
    const qtyProp = getPropertyOf<Inventory>('qty');

    return this.productModel.aggregate()
      .sort(sortingPaginating.sort)
      .skip(sortingPaginating.skip)
      .limit(sortingPaginating.limit)
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
      .project({ [`${variantsProp}.${descProp}`]: false })
      .exec();
  }

  async getProductWithQtyById(id: number): Promise<ProductWithQty> {
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

  async getProductWithQtyBySku(sku: string): Promise<ProductWithQty> {
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
      newProductModel.breadcrumbs = await this.buildBreadcrumbs(newProductModel.categoryIds);

      for (const dtoVariant of productDto.variants) {
        const savedVariant = newProductModel.variants.find(v => v._id.equals(dtoVariant.id));
        const { tmpMedias: checkedTmpMedias, savedMedias } = await this.mediaService.checkTmpAndSaveMedias(dtoVariant.medias, Product.collectionName);

        savedVariant.medias = savedMedias;
        tmpMedias.push(...checkedTmpMedias);

        await this.inventoryService.createInventory(dtoVariant.sku, newProductModel.id, dtoVariant.qty, session);
        await this.createProductPageRegistry(dtoVariant.slug, session);
      }

      await newProductModel.save({ session });
      await this.addSearchData(newProductModel, productDto);
      await session.commitTransaction();

      this.updateCachedProductCount();
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
      found.breadcrumbs = await this.buildBreadcrumbs(found.categoryIds);
      await found.save({ session });
      await this.updateSearchData(found, productDto);
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
      await this.deleteSearchData(deleted.id);
      await session.commitTransaction();

      this.updateCachedProductCount();
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
    if (this.cachedProductCount >= 0) {
      return this.cachedProductCount;
    } else {
      return this.productModel.estimatedDocumentCount().exec().then(count => this.cachedProductCount = count);
    }
  }

  async updateCachedProductCount(): Promise<any> {
    try {
      this.cachedProductCount = await this.productModel.estimatedDocumentCount().exec();
    } catch (e) { }
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
    categoryId = parseInt(categoryId as any);

    const conditions: Partial<Product> = { categoryIds: categoryId as any };
    const breadcrumbToRemove: Partial<ProductBreadcrumb> = { id: categoryId };
    const update: Partial<Product> = { categoryIds: categoryId as any, breadcrumbs: breadcrumbToRemove as any };

    return this.productModel
      .updateMany(
        conditions,
        { $pull: update }
      )
      .session(session)
      .exec();
  }

  async updateBreadcrumbs(breadcrumb: ProductBreadcrumb, session: ClientSession): Promise<any> {
    const breadcrumbsProp = getPropertyOf<Product>('breadcrumbs');
    const idProp = getPropertyOf<ProductBreadcrumb>('id');

    return this.productModel
      .updateMany(
        { [`${breadcrumbsProp}.${idProp}`]: breadcrumb.id },
        { [`${breadcrumbsProp}.$`]: breadcrumb }
      )
      .session(session)
      .exec();
  }

  private async buildBreadcrumbs(categoryIds: number[]): Promise<ProductBreadcrumb[]> {
    const breadcrumbsVariants: ProductBreadcrumb[][] = [];

    const populate = (treeItems: AdminCategoryTreeItem[], breadcrumbs: ProductBreadcrumb[] = []) => {

      for (const treeItem of treeItems) {
        const newBreadcrumbs: ProductBreadcrumb[] = JSON.parse(JSON.stringify(breadcrumbs));

        if (categoryIds.indexOf(treeItem.id) !== -1) {
          newBreadcrumbs.push({
            id: treeItem.id,
            name: treeItem.name,
            slug: treeItem.slug
          });
        }

        if (treeItem.children.length) {
          populate(treeItem.children, newBreadcrumbs);
        } else {
          breadcrumbsVariants.push(newBreadcrumbs);
        }
      }
    };

    const categoryTreeItems = await this.categoryService.getCategoriesTree();
    populate(categoryTreeItems);

    breadcrumbsVariants.sort((a, b) => b.length - a.length);
    return breadcrumbsVariants[0] || [];
  }

  private async addSearchData(product: Product, productDto: AdminAddOrUpdateProductDto) {
    const productWithQty = this.transformToProductWithQty(product, productDto);
    const [ listItem ] = this.transformProductsWithQtyToListItemDtos([productWithQty], true);
    await this.searchService.addDocument(Product.collectionName, product.id, listItem);
  }

  private updateSearchData(product: Product, productDto: AdminAddOrUpdateProductDto): Promise<any> {
    const productWithQty = this.transformToProductWithQty(product, productDto);
    const [ listItem ] = this.transformProductsWithQtyToListItemDtos([productWithQty], true);
    return this.searchService.updateDocument(Product.collectionName, product.id, listItem);
  }

  private deleteSearchData(productId: number): Promise<any> {
    return this.searchService.deleteDocument(Product.collectionName, productId);
  }

  private async searchByFilters(spf: AdminSortingPaginatingFilterDto, withVariants: boolean) {
    return this.searchService.searchByFilters<ProductListItem>(
      Product.collectionName,
      spf.getNormalizedFilters(),
      spf.skip,
      spf.limit
    ).then(result => {
      if (!withVariants) {
        result[0] = result[0].map(product => {
          delete product.variants;
          return product;
        });
      }

      return result;
    });
  }

  private transformProductsWithQtyToListItemDtos(products: ProductWithQty[], withVariants: boolean): AdminProductListItemDto[] {
    return products.map(product => {
      const skus: string[] = [];
      const prices: string[] = [];
      const quantities: number[] = [];
      const variants: AdminProductVariantListItem[] = [];
      let mediaUrl: string = null;

      product.variants.forEach(variant => {
        skus.push(variant.sku);
        prices.push(`${variant.priceInDefaultCurrency} ${DEFAULT_CURRENCY}`);
        quantities.push(variant.qty);
        variant.medias.forEach(media => {
          if (!mediaUrl) { mediaUrl = media.variantsUrls.original; }
        });

        variants.push({
          id: variant._id.toString(),
          isEnabled: variant.isEnabled,
          mediaUrl: variant.medias[0] && variant.medias[0].variantsUrls.original,
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          currency: variant.currency,
          priceInDefaultCurrency: variant.priceInDefaultCurrency,
          qty: variant.qty
        });
      });

      return {
        id: product._id,
        name: product.name,
        isEnabled: product.isEnabled,
        skus: skus.join(', '),
        prices: prices.join(', '),
        quantities: quantities.join(', '),
        mediaUrl,
        ...(withVariants ? { variants } : {})
      };
    });
  }

  private transformToProductWithQty(product: Product, productDto: AdminAddOrUpdateProductDto): ProductWithQty {
    return {
      ...product,
      id: product._id,
      variants: product.variants.map(variant => {
        const variantInDto = productDto.variants.find(v => variant._id.equals(v.id));
        return {
          ...variant,
          id: variant._id,
          qty: variantInDto.qty
        }
      })
    }
  }
}
