import { forwardRef, Inject, Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { Product } from './models/product.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { InventoryService } from '../inventory/inventory.service';
import { PageRegistryService } from '../page-registry/page-registry.service';
import { InjectModel } from '@nestjs/mongoose';
import { AdminAddOrUpdateProductDto } from '../shared/dtos/admin/product.dto';
import { CounterService } from '../shared/counter/counter.service';
import { FastifyRequest } from 'fastify';
import { Media } from '../shared/models/media.model';
import { AdminMediaDto } from '../shared/dtos/admin/media.dto';
import { AdminSortingPaginatingFilterDto } from '../shared/dtos/admin/spf.dto';
import { Inventory } from '../inventory/models/inventory.model';
import { getPropertyOf } from '../shared/helpers/get-property-of.function';
import { ClientSession } from 'mongoose';
import { AdminProductVariantDto } from '../shared/dtos/admin/product-variant.dto';
import { ProductReview } from '../reviews/product-review/models/product-review.model';
import { ProductReviewService } from '../reviews/product-review/product-review.service';
import { ProductVariant } from './models/product-variant.model';
import { MediaService } from '../shared/media-service/media.service';
import { CategoryService } from '../category/category.service';
import { Breadcrumb } from '../shared/models/breadcrumb.model';
import { SearchService } from '../shared/search/search.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { AdminProductListItemDto } from '../shared/dtos/admin/product-list-item.dto';
import { ProductWithQty } from './models/product-with-qty.model';
import { AdminProductVariantListItem } from '../shared/dtos/admin/product-variant-list-item.dto';
import { DEFAULT_CURRENCY } from '../shared/enums/currency.enum';
import { ElasticProductModel } from './models/elastic-product.model';
import { CategoryTreeItem } from '../shared/dtos/shared-dtos/category.dto';
import { SortingPaginatingFilterDto } from '../shared/dtos/shared-dtos/spf.dto';
import {
  ClientProductListItemDto,
  ClientProductVariantDto,
  ClientProductVariantGroupDto
} from '../shared/dtos/client/product-list-item.dto';
import { AttributeService } from '../attribute/attribute.service';
import {
  ClientProductCategoryDto,
  ClientProductCharacteristic,
  ClientProductDto
} from '../shared/dtos/client/product.dto';
import { plainToClass } from 'class-transformer';
import { ClientMediaDto } from '../shared/dtos/client/media.dto';
import { MetaTagsDto } from '../shared/dtos/shared-dtos/meta-tags.dto';
import { ClientProductSortingPaginatingFilterDto } from '../shared/dtos/client/product-spf.dto';
import { areArraysEqual } from '../shared/helpers/are-arrays-equal.function';
import { CurrencyService } from '../currency/currency.service';

@Injectable()
export class ProductService implements OnApplicationBootstrap {

  private logger = new Logger(ProductService.name);
  private cachedProductCount: number;

  constructor(@InjectModel(Product.name) private readonly productModel: ReturnModelType<typeof Product>,
              @Inject(forwardRef(() => ProductReviewService)) private readonly productReviewService: ProductReviewService,
              @Inject(forwardRef(() => CategoryService)) private readonly categoryService: CategoryService,
              private readonly inventoryService: InventoryService,
              private readonly counterService: CounterService,
              private readonly mediaService: MediaService,
              private readonly currencyService: CurrencyService,
              private readonly attributeService: AttributeService,
              private readonly searchService: SearchService,
              private readonly pageRegistryService: PageRegistryService) {
  }

  onApplicationBootstrap(): any {
    this.handleCurrencyUpdates();
    this.searchService.ensureCollection(Product.collectionName, new ElasticProductModel());
    // this.reindexAllSearchData();
  }

  async getAdminProductsList(spf: AdminSortingPaginatingFilterDto = new AdminSortingPaginatingFilterDto(),
                             withVariants: boolean
  ): Promise<ResponseDto<AdminProductListItemDto[]>> {

    let products: AdminProductListItemDto[];
    let itemsFiltered: number;

    if (spf.hasFilters()) {
      const searchResponse = await this.findByFilters(spf);
      products = searchResponse[0];
      itemsFiltered = searchResponse[1];
    } else {
      const productsWithQty = await this.getProductsWithQty(spf);
      products = this.transformToAdminListDto(productsWithQty);
    }

    if (!withVariants) {
      products = products.map(product => {
        delete product.variants;
        return product;
      });
    }
    const itemsTotal = await this.countProducts();

    return {
      data: products,
      page: spf.page,
      pagesTotal: Math.ceil((itemsFiltered === undefined ? itemsTotal : itemsFiltered) / spf.limit),
      itemsTotal,
      itemsFiltered
    }
  }

  async getClientProductListByFilters(spf: ClientProductSortingPaginatingFilterDto): Promise<ResponseDto<ClientProductListItemDto[]>> {

    const isEnabledProp: keyof AdminProductListItemDto = 'isEnabled';

    spf[isEnabledProp] = true;

    const searchResponse = await this.findByFilters(spf);
    const adminDtos = searchResponse[0];
    const itemsTotal = searchResponse[1];
    const clientDtos = await this.transformToClientListDto(adminDtos);

    return {
      data: clientDtos,
      page: spf.page,
      pagesTotal: Math.ceil(itemsTotal / spf.limit),
      itemsTotal
    }
  }

  async getProductsWithQty(sortingPaginating: AdminSortingPaginatingFilterDto = new AdminSortingPaginatingFilterDto()): Promise<ProductWithQty[]> {
    const variantsProp = getPropertyOf<Product>('variants');
    const descProp = getPropertyOf<ProductVariant>('fullDescription');
    const skuProp = getPropertyOf<Inventory>('sku');
    const qtyProp = getPropertyOf<Inventory>('qtyInStock');
    const reservedProp: keyof Inventory = 'reserved';

    return this.productModel.aggregate()
      .unwind(variantsProp)
      .lookup({
        'from': Inventory.collectionName,
        'let': { [variantsProp]: `$${variantsProp}` },
        'pipeline': [
          { $match: { $expr: { $eq: [ `$${skuProp}`, `$$${variantsProp}.${skuProp}` ] } } },
          { $replaceRoot: { newRoot: { $mergeObjects: [{ [qtyProp]: `$${qtyProp}` }, { [reservedProp]: `$${reservedProp}` }, `$$${variantsProp}`] } }}
        ],
        'as': variantsProp
      })
      .group({ '_id': '$_id', [variantsProp]: { $push: { $arrayElemAt: [`$$ROOT.${variantsProp}`, 0] } }, 'document': { $mergeObjects: '$$ROOT' } })
      .replaceRoot({ $mergeObjects: ['$document', { [variantsProp]: `$${variantsProp}`}] })
      .project({ [`${variantsProp}.${descProp}`]: false })
      .sort(sortingPaginating.getSortAsObj())
      .skip(sortingPaginating.skip)
      .limit(sortingPaginating.limit)
      .exec();
  }

  async getProductWithQtyById(id: number): Promise<ProductWithQty> {
    const variantsProp = getPropertyOf<Product>('variants');
    const skuProp = getPropertyOf<Inventory>('sku');
    const qtyProp = getPropertyOf<Inventory>('qtyInStock');
    const reservedProp: keyof Inventory = 'reserved';

    const [ found ] = await this.productModel.aggregate()
      .match({ _id: id })
      .unwind(variantsProp)
      .lookup({
        'from': Inventory.collectionName,
        'let': { [variantsProp]: `$${variantsProp}` },
        'pipeline': [
          { $match: { $expr: { $eq: [ `$${skuProp}`, `$$${variantsProp}.${skuProp}` ] } } },
          { $replaceRoot: { newRoot: { $mergeObjects: [{ [qtyProp]: `$${qtyProp}` }, { [reservedProp]: `$${reservedProp}` }, `$$${variantsProp}`] } }}
        ],
        'as': variantsProp
      })
      .group({ '_id': '$_id', [variantsProp]: { $push: { $arrayElemAt: [`$$ROOT.${variantsProp}`, 0] } }, 'document': { $mergeObjects: '$$ROOT' } })
      .replaceRoot({ $mergeObjects: ['$document', { [variantsProp]: `$${variantsProp}`}] })
      .exec();

    if (!found) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }

    return found;
  }

  async getProductWithQtyBySku(sku: string): Promise<ProductWithQty> {
    const variantsProp = getPropertyOf<Product>('variants');
    const skuProp = getPropertyOf<Inventory>('sku');
    const qtyProp = getPropertyOf<Inventory>('qtyInStock');
    const reservedProp: keyof Inventory = 'reserved';

    const [ found ] = await this.productModel.aggregate()
      .match({ [variantsProp + '.' + skuProp]: sku })
      .unwind(variantsProp)
      .lookup({
        'from': Inventory.collectionName,
        'let': { [variantsProp]: `$${variantsProp}` },
        'pipeline': [
          { $match: { $expr: { $eq: [ `$${skuProp}`, `$$${variantsProp}.${skuProp}` ] } } },
          { $replaceRoot: { newRoot: { $mergeObjects: [{ [qtyProp]: `$${qtyProp}` }, { [reservedProp]: `$${reservedProp}` }, `$$${variantsProp}`] } }}
        ],
        'as': variantsProp
      })
      .group({ '_id': '$_id', [variantsProp]: { $push: { $arrayElemAt: [`$$ROOT.${variantsProp}`, 0] } }, 'document': { $mergeObjects: '$$ROOT' } })
      .replaceRoot({ $mergeObjects: ['$document', { [variantsProp]: `$${variantsProp}`}] })
      .exec();

    if (!found) {
      throw new NotFoundException(`Product with sku '${sku}' not found`);
    }

    return found;
  }

  async getProductsWithQtyBySkus(skus: string[]): Promise<ProductWithQty[]> {
    const variantsProp = getPropertyOf<Product>('variants');
    const skuProp = getPropertyOf<Inventory>('sku');
    const qtyProp = getPropertyOf<Inventory>('qtyInStock');
    const reservedProp: keyof Inventory = 'reserved';

    const found = await this.productModel.aggregate()
      .match({ [variantsProp + '.' + skuProp]: { $in: skus } })
      .unwind(variantsProp)
      .lookup({
        'from': Inventory.collectionName,
        'let': { [variantsProp]: `$${variantsProp}` },
        'pipeline': [
          { $match: { $expr: { $eq: [ `$${skuProp}`, `$$${variantsProp}.${skuProp}` ] } } },
          { $replaceRoot: { newRoot: { $mergeObjects: [{ [qtyProp]: `$${qtyProp}` }, { [reservedProp]: `$${reservedProp}` }, `$$${variantsProp}`] } }}
        ],
        'as': variantsProp
      })
      .group({ '_id': '$_id', [variantsProp]: { $push: { $arrayElemAt: [`$$ROOT.${variantsProp}`, 0] } }, 'document': { $mergeObjects: '$$ROOT' } })
      .replaceRoot({ $mergeObjects: ['$document', { [variantsProp]: `$${variantsProp}`}] })
      .exec();

    return found;
  }

  async getClientProductDtoBySlug(slug: string): Promise<ClientProductDto> {
    const variantsProp = getPropertyOf<Product>('variants');
    const slugProp = getPropertyOf<ProductVariant>('slug');
    const skuProp = getPropertyOf<Inventory>('sku');
    const qtyProp = getPropertyOf<Inventory>('qtyInStock');
    const reservedProp: keyof Inventory = 'reserved';

    const [ found ] = await this.productModel.aggregate()
      .match({ [variantsProp + '.' + slugProp]: slug })
      .unwind(variantsProp)
      .lookup({
        'from': Inventory.collectionName,
        'let': { [variantsProp]: `$${variantsProp}` },
        'pipeline': [
          { $match: { $expr: { $eq: [ `$${skuProp}`, `$$${variantsProp}.${skuProp}` ] } } },
          { $replaceRoot: { newRoot: { $mergeObjects: [{ [qtyProp]: `$${qtyProp}` }, { [reservedProp]: `$${reservedProp}` }, `$$${variantsProp}`] } }}
        ],
        'as': variantsProp
      })
      .group({ '_id': '$_id', [variantsProp]: { $push: { $arrayElemAt: [`$$ROOT.${variantsProp}`, 0] } }, 'document': { $mergeObjects: '$$ROOT' } })
      .replaceRoot({ $mergeObjects: ['$document', { [variantsProp]: `$${variantsProp}`}] })
      .exec();

    if (!found) {
      throw new NotFoundException(`Product with slug '${slug}' not found`);
    }

    return this.transformToClientProductDto(found, slug);
  }

  async createProduct(productDto: AdminAddOrUpdateProductDto, migrate?: any): Promise<Product> {
    const session = await this.productModel.db.startSession();
    session.startTransaction();

    try {
      const tmpMediasToDelete: AdminMediaDto[] = [];
      const inventories: Inventory[] = [];

      const newProductModel = new this.productModel(productDto);
      if (!migrate) {
        newProductModel.id = await this.counterService.getCounter(Product.collectionName);
      }
      newProductModel.breadcrumbs = await this.buildBreadcrumbs(newProductModel.categoryIds);

      for (const dtoVariant of productDto.variants) {
        const savedVariant = newProductModel.variants.find(v => v.sku === dtoVariant.sku);
        const { tmpMedias, savedMedias } = await this.mediaService.checkTmpAndSaveMedias(dtoVariant.medias, Product.collectionName);

        tmpMediasToDelete.push(...tmpMedias);
        savedVariant.medias = await this.mediaService.duplicateSavedMedias(savedMedias, Product.collectionName);

        const inventory = await this.inventoryService.createInventory(dtoVariant.sku, newProductModel.id, dtoVariant.qtyInStock, session);
        inventories.push(inventory.toJSON());
        await this.createProductPageRegistry(dtoVariant.slug, session);
      }

      if (newProductModel.variants.every(variant => variant.isEnabled === false)) {
        newProductModel.isEnabled = false;
      }

      await this.setProductPrices(newProductModel);
      await newProductModel.save({ session });
      const productWithQty = this.transformToProductWithQty(newProductModel.toJSON(), inventories);
      await this.addSearchData(productWithQty);
      await session.commitTransaction();

      this.updateCachedProductCount();
      await this.mediaService.deleteTmpMedias(tmpMediasToDelete, Product.collectionName);

      return productWithQty;

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
      const tmpMediasToDelete: AdminMediaDto[] = [];
      const inventories: Inventory[] = [];

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
        const { tmpMedias, savedMedias } = await this.mediaService.checkTmpAndSaveMedias(variantDto.medias, Product.collectionName);
        variantDto.medias = savedMedias;
        tmpMediasToDelete.push(...tmpMedias);

        await this.createProductPageRegistry(variantDto.slug, session);
        const inventory = await this.inventoryService.createInventory(variantDto.sku, found.id, variantDto.qtyInStock, session);
        inventories.push(inventory.toJSON());
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
        tmpMediasToDelete.push(...checkedTmpMedias);

        if (variant.slug !== variantInDto.slug) {
          await this.updateProductPageRegistry(variant.slug, variantInDto.slug, session);
        }
        const inventory = await this.inventoryService.updateInventory(variant.sku, variantInDto.sku, variantInDto.qtyInStock, session);
        inventories.push(inventory.toJSON());
      }

      if (!areArraysEqual(found.categoryIds, productDto.categoryIds)) {
        productDto.breadcrumbs = await this.buildBreadcrumbs(productDto.categoryIds);
      }

      Object.keys(productDto).forEach(key => { found[key] = productDto[key]; });
      if (found.variants.every(variant => variant.isEnabled === false)) {
        found.isEnabled = false;
      }

      await this.setProductPrices(found);
      await found.save({ session });
      const productWithQty = this.transformToProductWithQty(found.toJSON(), inventories);
      await this.updateSearchData(productWithQty);
      await session.commitTransaction();

      await this.mediaService.deleteSavedMedias(mediasToDelete, Product.collectionName);
      await this.mediaService.deleteTmpMedias(tmpMediasToDelete, Product.collectionName);

      return productWithQty;

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

  updateCachedProductCount() {
    this.productModel.estimatedDocumentCount().exec()
      .then(count => this.cachedProductCount = count)
      .catch(_ => { });
  }

  async updateCounter() {
    const lastProduct = await this.productModel.findOne().sort('-_id').exec();
    return this.counterService.setCounter(Product.collectionName, lastProduct.id);
  }

  async addReviewToProduct(review: ProductReview, session?: ClientSession): Promise<any> {
    const countProp = getPropertyOf<Product>('reviewsCount');
    const ratingProp = getPropertyOf<Product>('reviewsAvgRating');

    return this.productModel
      .updateOne(
        { _id: review.productId as any },
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
    const countProp = getPropertyOf<Product>('reviewsCount');
    const ratingProp = getPropertyOf<Product>('reviewsAvgRating');

    return this.productModel
      .updateOne(
        { _id: review.productId as any },
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
    const variantsProp = getPropertyOf<Product>('variants');
    const countProp = getPropertyOf<ProductVariant>('salesCount');

    return this.productModel
      .updateOne(
        { _id: productId as any, variants: variantId as any },
        { $inc: { [`${variantsProp}.$.${countProp}`]: count } }
      )
      .session(session)
      .exec();
  }

  async removeCategoryId(categoryId: number, session: ClientSession): Promise<any> {
    categoryId = parseInt(categoryId as any);

    const breadcrumbToRemove: Partial<Breadcrumb> = { id: categoryId };
    const update: Partial<Product> = { categoryIds: categoryId as any, breadcrumbs: breadcrumbToRemove as any };

    return this.productModel
      .updateMany(
        { categoryIds: categoryId },
        { $pull: update }
      )
      .session(session)
      .exec();
  }

  async updateBreadcrumbs(breadcrumb: Breadcrumb, session: ClientSession): Promise<any> {
    const breadcrumbsProp = getPropertyOf<Product>('breadcrumbs');
    const idProp = getPropertyOf<Breadcrumb>('id');

    return this.productModel
      .updateMany(
        { [`${breadcrumbsProp}.${idProp}`]: breadcrumb.id },
        { [`${breadcrumbsProp}.$`]: breadcrumb }
      )
      .session(session)
      .exec();
  }

  private async buildBreadcrumbs(categoryIds: number[]): Promise<Breadcrumb[]> {
    const breadcrumbsVariants: Breadcrumb[][] = [];

    const populate = (treeItems: CategoryTreeItem[], breadcrumbs: Breadcrumb[] = []) => {

      for (const treeItem of treeItems) {
        const newBreadcrumbs: Breadcrumb[] = JSON.parse(JSON.stringify(breadcrumbs));

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

  private async addSearchData(productWithQty: ProductWithQty) {
    const [ adminListItem ] = this.transformToAdminListDto([productWithQty]);
    await this.searchService.addDocument(Product.collectionName, productWithQty.id, adminListItem);
  }

  private async updateSearchData(productWithQty: ProductWithQty): Promise<any> {
    const [ adminListItem ] = this.transformToAdminListDto([productWithQty]);
    await this.searchService.updateDocument(Product.collectionName, productWithQty.id, adminListItem);
  }

  private async deleteSearchData(productId: number): Promise<any> {
    await this.searchService.deleteDocument(Product.collectionName, productId);
  }

  private async findByFilters(spf: SortingPaginatingFilterDto) {
    return this.searchService.searchByFilters<AdminProductListItemDto>(
      Product.collectionName,
      spf.getNormalizedFilters(),
      spf.skip,
      spf.limit,
      spf.getSortAsObj()
    );
  }

  private transformToProductWithQty(product: Product, inventories: Inventory[]): ProductWithQty {
    return {
      ...product,
      id: product._id,
      variants: product.variants.map(variant => {
        const foundInventory = inventories.find(inventory => inventory.sku === variant.sku);
        return {
          ...variant,
          id: variant._id,
          qtyInStock: foundInventory.qtyInStock,
          reserved: foundInventory.reserved
        };
      })
    }
  }

  private transformToAdminListDto(products: ProductWithQty[]): AdminProductListItemDto[] {
    return products.map(product => {
      const skus: string[] = [];
      const prices: string[] = [];
      const quantitiesInStock: number[] = [];
      const sellableQuantities: number[] = [];
      const variants: AdminProductVariantListItem[] = [];
      let productMediaUrl: string = null;

      product.variants.forEach(variant => {
        skus.push(variant.sku);
        prices.push(`${variant.priceInDefaultCurrency} ${DEFAULT_CURRENCY}`);
        quantitiesInStock.push(variant.qtyInStock);
        sellableQuantities.push(variant.qtyInStock - variant.reserved.reduce((sum, ordered) => sum + ordered.qty, 0));

        let primaryMediaUrl;
        let secondaryMediaUrl;
        let mediaAltText;
        variant.medias.forEach(media => {
          if (!productMediaUrl) { productMediaUrl = media.variantsUrls.small; }

          if (!media.isHidden) {
            if (primaryMediaUrl) {
              secondaryMediaUrl = media.variantsUrls.small;
            } else {
              primaryMediaUrl = media.variantsUrls.small;
              mediaAltText = media.altText;
            }
          }
        });

        variants.push({
          id: variant._id.toString(),
          isEnabled: variant.isEnabled,
          mediaUrl: primaryMediaUrl,
          mediaAltText: mediaAltText,
          mediaHoverUrl: secondaryMediaUrl,
          name: variant.name,
          slug: variant.slug,
          attributes: variant.attributes,
          sku: variant.sku,
          price: variant.price,
          oldPrice: variant.oldPrice,
          currency: variant.currency,
          priceInDefaultCurrency: variant.priceInDefaultCurrency,
          oldPriceInDefaultCurrency: variant.oldPriceInDefaultCurrency,
          qtyInStock: variant.qtyInStock,
          sellableQty: variant.qtyInStock - variant.reserved.reduce((sum, ordered) => sum + ordered.qty, 0)
        });
      });

      return {
        id: product._id,
        categoryIds: product.categoryIds,
        name: product.name,
        attributes: product.attributes,
        isEnabled: product.isEnabled,
        skus: skus.join(', '),
        prices: prices.join(', '),
        quantitiesInStock: quantitiesInStock.join(', '),
        sellableQuantities: sellableQuantities.join(', '),
        mediaUrl: productMediaUrl,
        sortOrder: product.sortOrder,
        reviewsCount: product.reviewsCount,
        reviewsAvgRating: product.reviewsAvgRating,
        variants
      };
    });
  }

  private async transformToClientListDto(adminListItemDtos: AdminProductListItemDto[]): Promise<ClientProductListItemDto[]> { // todo cache
    const attributes = await this.attributeService.getAllAttributes();

    return adminListItemDtos.map(product => {
      const variant = product.variants[0]; // todo add flag in ProductVariant to select here default variant?

      const variantGroups: ClientProductVariantGroupDto[] = [];
      if (product.variants.length > 1) {
        product.variants.forEach(variant => {
          variant.attributes.forEach(selectedAttr => {
            const attribute = attributes.find(a => a.id === selectedAttr.attributeId);
            if (attribute!) { return; }

            const attrLabel = attribute.label;
            const attrValue = attribute.values.find(v => v.id === selectedAttr.valueId);
            if (!attrValue) { return; }

            const foundIdx = variantGroups.findIndex(group => group.label === attrLabel);

            const itemVariant: ClientProductVariantDto = {
              label: attrValue.label,
              isSelected: false,
              slug: variant.slug
            };

            if (foundIdx === -1) {
              variantGroups.push({
                label: attrLabel,
                variants: [ itemVariant ]
              });
            } else {
              variantGroups[foundIdx].variants.push(itemVariant);
            }
          });
        });
      }

      return {
        productId: product.id,
        variantId: variant.id,
        sku: variant.sku,
        isInStock: variant.sellableQty > 0,
        name: variant.name,
        price: variant.priceInDefaultCurrency,
        oldPrice: variant.oldPriceInDefaultCurrency,
        slug: variant.slug,
        variantGroups,
        mediaUrl: variant.mediaUrl,
        mediaHoverUrl: variant.mediaHoverUrl,
        mediaAltText: variant.mediaAltText,
        reviewsCount: product.reviewsCount,
        reviewsAvgRating: product.reviewsAvgRating,
      }
    });
  }

  private async transformToClientProductDto(productWithQty: ProductWithQty, slug: string): Promise<ClientProductDto> {
    const variant = productWithQty.variants.find(v => v.slug === slug);

    const categories: ClientProductCategoryDto[] = [];
    const categoryModels = await this.categoryService.getAllCategories();
    for (const categoryId of productWithQty.categoryIds) {
      const found = categoryModels.find(c => c.id === categoryId);
      if (!found) { continue; }

      categories.push({ id: found.id, name: found.name, slug: found.slug });
    }

    const variantGroups: ClientProductVariantGroupDto[] = [];
    const attributeModels = await this.attributeService.getAllAttributes();
    if (productWithQty.variants.length > 1) {
      productWithQty.variants.forEach(variant => {
        variant.attributes.forEach(selectedAttr => {
          const attribute = attributeModels.find(a => a.id === selectedAttr.attributeId);
          if (attribute!) { return; }

          const attrLabel = attribute.label;
          const attrValue = attribute.values.find(v => v.id === selectedAttr.valueId);
          if (!attrValue) { return; }

          const foundIdx = variantGroups.findIndex(group => group.label === attrLabel);

          const itemVariant: ClientProductVariantDto = {
            label: attrValue.label,
            isSelected: false,
            slug: variant.slug
          };

          if (foundIdx === -1) {
            variantGroups.push({
              label: attrLabel,
              variants: [ itemVariant ]
            });
          } else {
            variantGroups[foundIdx].variants.push(itemVariant);
          }
        });
      });
    }

    const characteristics: ClientProductCharacteristic[] = [];
    for (const attribute of productWithQty.attributes) {
      const foundAttr = attributeModels.find(a => a.id === attribute.attributeId);
      if (!foundAttr) { continue; }
      const foundAttrValue = foundAttr.values.find(v => v.id === attribute.valueId);
      if (!foundAttrValue) { continue; }

      characteristics.push({ label: foundAttr.label, code: foundAttr._id, value: foundAttrValue.label });
    }

    return {
      productId: productWithQty._id,
      variantId: variant._id.toString(),
      isInStock: variant.qtyInStock > variant.reserved.reduce((sum, ordered) => sum + ordered.qty, 0),
      categories,
      variantGroups,
      characteristics,
      breadcrumbs: productWithQty.breadcrumbs,
      fullDescription: variant.fullDescription,
      shortDescription: variant.shortDescription,
      medias: plainToClass(ClientMediaDto, variant.medias, { excludeExtraneousValues: true }),
      metaTags: plainToClass(MetaTagsDto, variant.metaTags, { excludeExtraneousValues: true }),
      name: variant.name,
      slug: variant.slug,
      sku: variant.sku,
      vendorCode: variant.vendorCode,
      gtin: variant.gtin,
      price: variant.priceInDefaultCurrency,
      oldPrice: variant.oldPriceInDefaultCurrency,
      reviewsAvgRating: productWithQty.reviewsAvgRating,
      reviewsCount: productWithQty.reviewsCount
    }
  }

  private async reindexAllSearchData() {
    await this.searchService.deleteCollection(Product.collectionName);
    this.logger.log('Deleted Products elastic collection');
    await this.searchService.ensureCollection(Product.collectionName, new ElasticProductModel());

    const spf = new AdminSortingPaginatingFilterDto();
    spf.limit = 10000;
    const products = await this.getProductsWithQty(spf);
    const listItems = this.transformToAdminListDto(products);
    for (let listItem of listItems) {
      await this.searchService.addDocument(Product.collectionName, listItem.id, listItem);
      console.log('Reindexed document with id', listItem.id);
    }
  }

  private async setProductPrices(product: DocumentType<Product>): Promise<DocumentType<Product>> {
    const exchangeRate = await this.currencyService.getExchangeRate(product.variants[0].currency);

    for (const variant of product.variants) {
      variant.priceInDefaultCurrency = Math.ceil(variant.price * exchangeRate);
      if (variant.oldPrice) {
        variant.oldPriceInDefaultCurrency = Math.ceil(variant.oldPrice * exchangeRate);
      }
    }

    return product;
  }

  private handleCurrencyUpdates() { // todo this method is ugly, do separation
    const variantsProp: keyof Product = 'variants';
    const currencyProp: keyof ProductVariant = 'currency';
    const priceProp: keyof ProductVariant = 'price';
    const defaultPriceProp: keyof ProductVariant = 'priceInDefaultCurrency';
    const oldPriceProp: keyof ProductVariant = 'oldPrice';
    const defaultOldPriceProp: keyof ProductVariant = 'oldPriceInDefaultCurrency';

    this.currencyService.echangeRatesUpdated$.subscribe(currencies => {
      for (const currency of currencies) {
        const query = { [`${variantsProp}.${currencyProp}`]: currency._id };

        this.productModel.updateMany(
          query,
          [
            {
              $addFields: {
                [variantsProp]: {
                  $map: {
                    input: `$${variantsProp}`,
                    in: {
                      $mergeObjects: [
                        '$$this',
                        {
                          [defaultPriceProp]: {
                            $ceil: { $multiply: [`$$this.${priceProp}`, currency.exchangeRate] }
                          }
                        },
                        {
                          [defaultOldPriceProp]: {
                            $ceil: { $multiply: [`$$this.${oldPriceProp}`, currency.exchangeRate] }
                          }
                        }
                      ]
                    }
                  }
                }
              }
            },
          ]
        ).exec();

        const elasticUpdateScript = `
          ctx._source.${variantsProp}.forEach(variant -> {
            if (variant.${oldPriceProp} != null) {
              variant.${defaultOldPriceProp} = Math.ceil(variant.${oldPriceProp} * ${currency.exchangeRate});
            }
            variant.${defaultPriceProp} = Math.ceil(variant.${priceProp} * ${currency.exchangeRate});
          })
        `;
        this.searchService.updateByQuery(Product.collectionName, query, elasticUpdateScript);
      }
    });
  }
}
