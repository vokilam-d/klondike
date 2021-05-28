import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { Product } from '../models/product.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { InventoryService } from '../../inventory/inventory.service';
import { PageRegistryService } from '../../page-registry/page-registry.service';
import { InjectModel } from '@nestjs/mongoose';
import { AdminAddOrUpdateProductDto } from '../../shared/dtos/admin/product.dto';
import { CounterService } from '../../shared/services/counter/counter.service';
import { FastifyRequest } from 'fastify';
import { Media } from '../../shared/models/media.model';
import { AdminMediaDto } from '../../shared/dtos/admin/media.dto';
import { AdminSPFDto } from '../../shared/dtos/admin/spf.dto';
import { Inventory } from '../../inventory/models/inventory.model';
import { getPropertyOf } from '../../shared/helpers/get-property-of.function';
import { ClientSession, FilterQuery } from 'mongoose';
import { AdminProductVariantDto } from '../../shared/dtos/admin/product-variant.dto';
import { ProductReviewService } from '../../reviews/product-review/product-review.service';
import { ProductVariant } from '../models/product-variant.model';
import { MediaService } from '../../shared/services/media/media.service';
import { CategoryService } from '../../category/category.service';
import { Breadcrumb } from '../../shared/models/breadcrumb.model';
import { SearchService } from '../../shared/services/search/search.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { AdminProductListItemDto } from '../../shared/dtos/admin/product-list-item.dto';
import { ProductWithQty } from '../models/product-with-qty.model';
import { AdminProductVariantListItemDto } from '../../shared/dtos/admin/product-variant-list-item.dto';
import { DEFAULT_CURRENCY } from '../../shared/enums/currency.enum';
import { ElasticProduct } from '../models/elastic-product.model';
import { IFilter, SortingPaginatingFilterDto } from '../../shared/dtos/shared-dtos/spf.dto';
import { AttributeService } from '../../attribute/attribute.service';
import { areArraysEqual } from '../../shared/helpers/are-arrays-equal.function';
import { CurrencyService } from '../../currency/currency.service';
import { ProductCategory } from '../models/product-category.model';
import { AdminProductCategoryDto } from '../../shared/dtos/admin/product-category.dto';
import { ProductReorderDto } from '../../shared/dtos/admin/reorder.dto';
import { ReorderPositionEnum } from '../../shared/enums/reorder-position.enum';
import { __ } from '../../shared/helpers/translate/translate.function';
import { Attribute } from '../../attribute/models/attribute.model';
import { AdminProductSelectedAttributeDto } from '../../shared/dtos/admin/product-selected-attribute.dto';
import { CronProdPrimaryInstance } from '../../shared/decorators/primary-instance-cron.decorator';
import { PageTypeEnum } from '../../shared/enums/page-type.enum';
import { getCronExpressionEarlyMorning } from '../../shared/helpers/get-cron-expression-early-morning.function';
import { ReservedInventory } from '../../inventory/models/reserved-inventory.model';
import { addLeadingZeros } from '../../shared/helpers/add-leading-zeros.function';
import { UnfixProductOrderDto } from '../../shared/dtos/admin/unfix-product-order.dto';
import { Category } from '../../category/models/category.model';
import { MultilingualText } from '../../shared/models/multilingual-text.model';
import { AdminCategoryTreeItemDto } from '../../shared/dtos/admin/category-tree-item.dto';
import { Language } from '../../shared/enums/language.enum';
import { EventsService } from '../../shared/services/events/events.service';
import { adminDefaultLanguage } from '../../shared/constants';
import { AdminProductSPFDto } from '../../shared/dtos/admin/product-spf.dto';

@Injectable()
export class AdminProductService implements OnApplicationBootstrap {

  private logger = new Logger(AdminProductService.name);

  static productUpdatedEventName: string = 'product-updated';

  constructor(
    @InjectModel(Product.name) private readonly productModel: ReturnModelType<typeof Product>,
    @Inject(forwardRef(() => ProductReviewService)) private readonly productReviewService: ProductReviewService,
    @Inject(forwardRef(() => CategoryService)) private readonly categoryService: CategoryService,
    private readonly inventoryService: InventoryService,
    private readonly counterService: CounterService,
    private readonly mediaService: MediaService,
    private readonly currencyService: CurrencyService,
    private readonly attributeService: AttributeService,
    private readonly searchService: SearchService,
    private readonly pageRegistryService: PageRegistryService,
    private readonly eventsService: EventsService
  ) { }

  async onApplicationBootstrap() {
    this.searchService.ensureCollection(Product.collectionName, new ElasticProduct());
    this.handleCurrencyUpdates();
    // this.reindexAllSearchData();

    // const products = await this.productModel.find().exec();
    // for (const product of products) {
    //   for (const variant of product.variants) {
    //     variant.purchasePrice = 0;
    //     variant.purchaseCurrency = CurrencyCodeEnum.UAH;
    //   }
    //   await product.save();
    //   console.log('saved product', product.id);
    // }
    // console.log('saved all');
    // this.reindexAllSearchData();
  }

  async getAdminProductsList(
    spf: AdminSPFDto | AdminProductSPFDto,
    withVariants: boolean
  ): Promise<ResponseDto<AdminProductListItemDto[]>> {

    const filters = await this.buildAdminFilters(spf);
    let [ products, itemsFiltered ] = await this.findByFilters(spf, filters);
    const itemsTotal = await this.countProducts();

    products = await this.filterListItemsByAdminSpf(products, spf);

    if (!withVariants) {
      products = products.map(({ variants, ...product }) => product);
    }

    return {
      data: products,
      page: spf.page,
      pagesTotal: Math.ceil((itemsFiltered) / spf.limit),
      itemsTotal,
      itemsFiltered: spf.hasFilters() ? itemsFiltered : undefined
    };
  }

  async getProductsWithQty(sortingPaginating: AdminSPFDto = new AdminSPFDto()): Promise<ProductWithQty[]> {
    const variantsProp = getPropertyOf<Product>('variants');
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
      .sort(sortingPaginating.getSortAsObj())
      .skip(sortingPaginating.skip)
      .limit(sortingPaginating.limit)
      .exec();
  }

  async getProductsWithQtyByIds(productIds: number[], sortingPaginating: AdminSPFDto = new AdminSPFDto()): Promise<ProductWithQty[]> {
    const variantsProp = getPropertyOf<Product>('variants');
    const skuProp = getPropertyOf<Inventory>('sku');
    const qtyProp = getPropertyOf<Inventory>('qtyInStock');
    const reservedProp: keyof Inventory = 'reserved';

    return this.productModel.aggregate()
      .match({ _id: { $in: productIds } })
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
      .sort(sortingPaginating.getSortAsObj())
      .skip(sortingPaginating.skip)
      .limit(sortingPaginating.limit)
      .exec();
  }

  async getProductWithQtyById(id: number, lang: Language, session?: ClientSession): Promise<ProductWithQty> {
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
      .session(session)
      .exec();

    if (!found) {
      throw new NotFoundException(__('Product with id "$1" not found', lang, id));
    }

    return found;
  }

  async getProductWithQtyBySku(sku: string, lang: Language): Promise<ProductWithQty> {
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
      throw new NotFoundException(__('Product with sku "$1" not found', lang, sku));
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

  async createProduct(productDto: AdminAddOrUpdateProductDto, lang: Language): Promise<Product> {
    const session = await this.productModel.db.startSession();
    session.startTransaction();

    try {
      const tmpMediasToDelete: AdminMediaDto[] = [];
      const inventories: Inventory[] = [];

      for (const dtoVariant of productDto.variants) {
        const skuCounter = await this.counterService.getCounter('sku', session);
        dtoVariant.sku = addLeadingZeros(skuCounter, 5);
      }

      const newProductModel = new this.productModel(productDto);
      newProductModel.id = await this.counterService.getCounter(Product.collectionName, session);
      await this.populateProductCategoriesAndBreadcrumbs(newProductModel);

      for (const dtoVariant of productDto.variants) {
        const savedVariant = newProductModel.variants.find(v => v.sku === dtoVariant.sku);
        const { tmpMedias, savedMedias } = await this.mediaService.checkForTmpAndSaveMedias(dtoVariant.medias, Product.collectionName);

        tmpMediasToDelete.push(...tmpMedias);
        savedVariant.medias = await this.mediaService.duplicateSavedMedias(savedMedias, Product.collectionName);

        const inventory = await this.inventoryService.createInventory(dtoVariant.sku, newProductModel.id, dtoVariant.qtyInStock, session);
        inventories.push(inventory.toJSON());
        await this.createProductPageRegistry(dtoVariant.slug, session);
      }

      if (newProductModel.variants.every(variant => variant.isEnabled === false)) {
        newProductModel.isEnabled = false;
      }

      await this.setProductPrices(newProductModel, lang);
      await newProductModel.save({ session });
      const productWithQty = this.transformToProductWithQty(newProductModel.toJSON(), inventories);
      await this.addSearchData(productWithQty);
      await session.commitTransaction();

      this.onProductUpdate();
      await this.mediaService.deleteTmpMedias(tmpMediasToDelete, Product.collectionName);

      return productWithQty;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async updateProduct(productId: number, productDto: AdminAddOrUpdateProductDto, lang: Language): Promise<Product> {
    const found = await this.productModel.findById(productId).exec();
    if (!found) {
      throw new NotFoundException(__('Product with id "$1" not found', lang, productId));
    }

    const session = await this.productModel.db.startSession();
    session.startTransaction();

    try {
      const mediasToDelete: Media[] = [];
      const tmpMediasToDelete: AdminMediaDto[] = [];
      const inventories: Inventory[] = [];

      const variantsToUpdate: AdminProductVariantDto[] = [];
      const variantsToAdd: AdminProductVariantDto[] = [];
      for (const variantDto of productDto.variants) {
        if (variantDto.id) {
          variantsToUpdate.push(variantDto);
        } else {
          const skuCounter = await this.counterService.getCounter('sku', session);
          variantDto.sku = addLeadingZeros(skuCounter, 5);
          variantsToAdd.push(variantDto);
        }
      }

      for (const variantDto of variantsToAdd) {
        const { tmpMedias, savedMedias } = await this.mediaService.checkForTmpAndSaveMedias(variantDto.medias, Product.collectionName);
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

        const { tmpMedias: checkedTmpMedias, savedMedias } = await this.mediaService.checkForTmpAndSaveMedias(variantInDto.medias, Product.collectionName);
        variantInDto.medias = savedMedias;
        tmpMediasToDelete.push(...checkedTmpMedias);

        if (variant.slug !== variantInDto.slug) {
          await this.updateProductPageRegistry(variant.slug, variantInDto.slug, variantInDto.createRedirect, session);
        }
        const inventory = await this.inventoryService.updateInventory(variant.sku, variantInDto.sku, variantInDto.qtyInStock, lang, session);
        inventories.push(inventory.toJSON());
      }

      if (!AdminProductService.areProductCategoriesEqual(found.categories, productDto.categories)) {
        await this.populateProductCategoriesAndBreadcrumbs(productDto);
      }

      Object.keys(productDto).forEach(key => { found[key] = productDto[key]; });
      if (found.variants.every(variant => variant.isEnabled === false)) {
        found.isEnabled = false;
      }

      await this.setProductPrices(found, lang);
      found.updatedAt = new Date();
      await found.save({ session });
      const productWithQty = this.transformToProductWithQty(found.toJSON(), inventories);
      await this.updateSearchData(productWithQty);
      await session.commitTransaction();

      await this.mediaService.deleteSavedMedias(mediasToDelete, Product.collectionName);
      await this.mediaService.deleteTmpMedias(tmpMediasToDelete, Product.collectionName);
      this.onProductUpdate();

      return productWithQty;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async deleteProduct(productId: number, lang: Language): Promise<Product> {
    const session = await this.productModel.db.startSession();
    session.startTransaction();

    try {
      const deleted = await this.productModel.findByIdAndDelete(productId).exec();
      if (!deleted) {
        throw new NotFoundException(__('Product with id "$1" not found', lang, productId));
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

      this.onProductUpdate();
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
      type: PageTypeEnum.Product
    }, session);
  }

  private updateProductPageRegistry(oldSlug: string, newSlug: string, createRedirect: boolean, session: ClientSession) {
    return this.pageRegistryService.updatePageRegistry({
      oldSlug,
      newSlug,
      type: PageTypeEnum.Product,
      createRedirect
    }, session);
  }

  private deleteProductPageRegistry(slug: string, session: ClientSession) {
    return this.pageRegistryService.deletePageRegistry(slug, session);
  }

  async countProducts(): Promise<number> {
    return this.productModel.estimatedDocumentCount().exec();
  }

  async updateReviewRating(productId: number, lang: Language, session: ClientSession): Promise<any> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException(__('Product with id "$1" not found', lang, productId));
    }

    const { reviewsAvgRating, textReviewsCount, allReviewsCount } = await this.productReviewService.getRatingInfo(productId, session);
    product.reviewsAvgRating = reviewsAvgRating;
    product.textReviewsCount = textReviewsCount;
    product.allReviewsCount = allReviewsCount;

    await product.save({ session });
    await this.updateSearchDataById(productId, lang, session);
    this.onProductUpdate();
  }

  async incrementSalesCount(productId: number, variantId: string, count: number, session: ClientSession): Promise<any> {
    const variantsProp = getPropertyOf<Product>('variants');
    const countProp = getPropertyOf<ProductVariant>('salesCount');

    return this.productModel
      .updateOne(
        { _id: productId as any, [`${variantsProp}._id`]: variantId as any },
        { $inc: { [`${variantsProp}.$.${countProp}`]: count } }
      )
      .session(session)
      .exec();
  }

  async removeCategoryId(categoryId: number, session: ClientSession): Promise<any> {
    categoryId = parseInt(categoryId as any);

    const categoryToRemove: Partial<ProductCategory> = { id: categoryId };
    const breadcrumbToRemove: Partial<Breadcrumb> = { id: categoryId };

    const categoriesProp: keyof Product = 'categories';
    const categoryIdProp: keyof ProductCategory = 'id';
    const breadcrumbsProp: keyof Product = 'breadcrumbs';

    await this.productModel
      .updateMany(
        { [`${categoriesProp}.${categoryIdProp}`]: categoryId },
        { $pull: { [categoriesProp]: categoryToRemove, [breadcrumbsProp]: breadcrumbToRemove } }
      )
      .session(session)
      .exec();

    this.onProductUpdate();
  }

  async updateProductCategory(categoryId: number, categoryName: MultilingualText, categorySlug: string, categoryIsEnabled: boolean, session: ClientSession): Promise<any> {
    const categoriesProp: keyof Product = 'categories';
    const categoryIdProp: keyof ProductCategory = 'id';
    const categoryNameProp: keyof ProductCategory = 'name';
    const categorySlugProp: keyof ProductCategory = 'slug';
    const categoryIsEnabledProp: keyof ProductCategory = 'isEnabled';

    await this.productModel
      .updateMany(
        { [`${categoriesProp}.${categoryIdProp}`]: categoryId },
        {
          [`${categoriesProp}.$.${categoryNameProp}`]: categoryName,
          [`${categoriesProp}.$.${categorySlugProp}`]: categorySlug,
          [`${categoriesProp}.$.${categoryIsEnabledProp}`]: categoryIsEnabled
        }
      )
      .session(session)
      .exec();

    // todo remove this lines under after converting breadcrumbs to ids only
    const breadcrumbsProp = getPropertyOf<Product>('breadcrumbs');
    const idProp = getPropertyOf<Breadcrumb>('id');
    const breadcrumb: Breadcrumb = { id: categoryId, name: categoryName, slug: categorySlug, isEnabled: categoryIsEnabled };

    await this.productModel
      .updateMany(
        { [`${breadcrumbsProp}.${idProp}`]: breadcrumb.id },
        { [`${breadcrumbsProp}.$`]: breadcrumb }
      )
      .session(session)
      .exec();

    this.onProductUpdate();
  }

  async rebuildBreadcrumbsForCategory(categoryId: string, categories: Category[], session: ClientSession): Promise<void> {
    const breadcrumbsProp = getPropertyOf<Product>('breadcrumbs');
    const breadcrumbIdProp = getPropertyOf<Breadcrumb>('id');

    const products = await this.productModel.find({ [`${breadcrumbsProp}.${breadcrumbIdProp}`]: categoryId }).session(session).exec();
    for (const product of products) {
      await this.populateProductCategoriesAndBreadcrumbs(product, categories);
      await product.save({ session });
      await this.updateSearchDataById(product.id, adminDefaultLanguage, session);
    }
    this.onProductUpdate();
  }

  private async populateProductCategoriesAndBreadcrumbs(product: Product | AdminAddOrUpdateProductDto, categories?: Category[]): Promise<void> {
    const breadcrumbsVariants: Breadcrumb[][] = [];

    if (!categories) {
      categories = await this.categoryService.getAllCategories({ onlyEnabled: true });
    }

    const buildBreadcrumb = (category: Category): Breadcrumb => ({ id: category.id, name: category.name, isEnabled: category.isEnabled, slug: category.slug });

    for (const productCategory of product.categories) {
      let category = categories.find(cat => cat.id === productCategory.id);
      productCategory.name = category.name;
      productCategory.slug = category.slug;
      productCategory.isEnabled = category.isEnabled;

      const breadcrumbs: Breadcrumb[] = [];
      breadcrumbs.push(buildBreadcrumb(category));
      while (category.parentId) {
        category = categories.find(cat => cat.id === category.parentId);
        breadcrumbs.unshift(buildBreadcrumb(category));
      }
      breadcrumbsVariants.push(breadcrumbs);
    }

    breadcrumbsVariants.sort((a, b) => b.length - a.length);
    product.breadcrumbs = breadcrumbsVariants[0] || [];
  }

  private async addSearchData(productWithQty: ProductWithQty) {
    const [ adminListItem ] = this.transformToAdminListDto([productWithQty]);
    await this.searchService.addDocument(Product.collectionName, productWithQty.id, adminListItem);
  }

  private async updateSearchData(productWithQty: ProductWithQty): Promise<any> {
    const [ adminListItem ] = this.transformToAdminListDto([productWithQty]);
    await this.searchService.updateDocument(Product.collectionName, adminListItem.id, adminListItem);
  }

  async updateSearchDataById(productId: number, lang: Language, session: ClientSession): Promise<any> {
    const product = await this.getProductWithQtyById(productId, lang, session);
    return this.updateSearchData(product);
  }

  private async deleteSearchData(productId: number): Promise<any> {
    await this.searchService.deleteDocument(Product.collectionName, productId);
  }

  async findByFilters(spf: SortingPaginatingFilterDto, filters: IFilter[]) {
    return this.searchService.searchByFilters<AdminProductListItemDto>(
      Product.collectionName,
      filters,
      spf.skip,
      spf.limit,
      spf.getSortAsObj(),
      spf.sortFilter,
      new ElasticProduct()
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
      const vendorCodes: string[] = [];
      const prices: string[] = [];
      const quantitiesInStock: number[] = [];
      const sellableQuantities: number[] = [];
      const variants: AdminProductVariantListItemDto[] = [];
      let salesCount: number = 0;
      let productMediaUrl: string = null;

      for (const variant of product.variants) {
        skus.push(variant.sku);
        if (variant.vendorCode) { vendorCodes.push(variant.vendorCode); }
        prices.push(`${variant.priceInDefaultCurrency} ${DEFAULT_CURRENCY}`);
        quantitiesInStock.push(variant.qtyInStock);
        sellableQuantities.push(variant.qtyInStock - variant.reserved?.reduce((sum, ordered) => sum + ordered.qty, 0));
        salesCount += variant.salesCount;

        let primaryMediaUrl;
        let secondaryMediaUrl;
        let mediaAltText;
        variant.medias.forEach(media => {
          if (media.isHidden) { return; }

          if (!productMediaUrl) { productMediaUrl = media.variantsUrls.small; }

          if (!primaryMediaUrl) {
            primaryMediaUrl = media.variantsUrls.small;
            mediaAltText = media.altText;
          } else if (!secondaryMediaUrl) {
            secondaryMediaUrl = media.variantsUrls.small;
          }
        });

        variants.push({
          id: variant._id.toString(),
          isEnabled: variant.isEnabled,
          mediaUrl: primaryMediaUrl,
          mediaAltText: mediaAltText,
          mediaHoverUrl: secondaryMediaUrl,
          label: variant.label,
          name: variant.name,
          slug: variant.slug,
          attributes: variant.attributes,
          sku: variant.sku,
          gtin: variant.gtin,
          vendorCode: variant.vendorCode,
          price: variant.price,
          oldPrice: variant.oldPrice,
          currency: variant.currency,
          priceInDefaultCurrency: variant.priceInDefaultCurrency,
          oldPriceInDefaultCurrency: variant.oldPriceInDefaultCurrency,
          qtyInStock: variant.qtyInStock,
          sellableQty: variant.qtyInStock - variant.reserved?.reduce((sum, ordered) => sum + ordered.qty, 0),
          salesCount: variant.salesCount,
          isIncludedInShoppingFeed: variant.isIncludedInShoppingFeed
        });
      }

      return {
        id: product._id,
        categories: product.categories,
        name: product.name,
        attributes: product.attributes,
        isEnabled: product.isEnabled,
        skus: product.variants[0].sku,
        gtins: product.variants[0].gtin,
        vendorCodes: product.variants[0].vendorCode,
        prices: product.variants[0].price + '',
        quantitiesInStock: product.variants[0].qtyInStock + '',
        sellableQuantities: (product.variants[0].qtyInStock - product.variants[0].reserved?.reduce((sum, ordered) => sum + ordered.qty, 0)) + '',
        mediaUrl: productMediaUrl,
        allReviewsCount: product.allReviewsCount,
        textReviewsCount: product.textReviewsCount,
        reviewsAvgRating: product.reviewsAvgRating,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        currency: product.variants[0].currency,
        note: product.note,
        isIncludedInShoppingFeed: product.variants[0].isIncludedInShoppingFeed,
        salesCount,
        variants
      };
    });
  }

  private async setProductPrices(product: DocumentType<Product>, lang: Language): Promise<DocumentType<Product>> {
    const exchangeRate = await this.currencyService.getExchangeRate(product.variants[0].currency, lang);

    for (const variant of product.variants) {
      variant.priceInDefaultCurrency = Math.ceil(variant.price * exchangeRate);
      variant.oldPriceInDefaultCurrency = variant.oldPrice ? Math.ceil(variant.oldPrice * exchangeRate) : variant.oldPrice;
    }

    return product;
  }

  private handleCurrencyUpdates() { // todo this method is ugly, do separation on repositories
    const variantsProp: keyof Product = 'variants';
    const currencyProp: keyof ProductVariant = 'currency';
    const priceProp: keyof ProductVariant = 'price';
    const defaultPriceProp: keyof ProductVariant = 'priceInDefaultCurrency';
    const oldPriceProp: keyof ProductVariant = 'oldPrice';
    const defaultOldPriceProp: keyof ProductVariant = 'oldPriceInDefaultCurrency';

    this.currencyService.echangeRatesUpdated$.subscribe(async currencies => {
      for (const currency of currencies) {
        try {
          const query = { [`${variantsProp}.${currencyProp}`]: currency._id };

          await this.productModel.updateMany(
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

          const elasticQuery = {
            nested: {
              path: variantsProp,
              query: {
                term: { [`${variantsProp}.${currencyProp}`]: currency._id }
              }
            }
          };
          const elasticUpdateScript = `
            ctx._source.${variantsProp}.forEach(variant -> {
              if (variant.${oldPriceProp} != null) {
                variant.${defaultOldPriceProp} = Math.ceil(variant.${oldPriceProp} * ${currency.exchangeRate});
              }
              variant.${defaultPriceProp} = Math.ceil(variant.${priceProp} * ${currency.exchangeRate});
            })
          `;
          await this.searchService.updateByQuery(Product.collectionName, elasticQuery, elasticUpdateScript);
        } catch (ex) {
          this.logger.error(`Could not update product prices on currency update:`)
          this.logger.error(ex.meta?.body || ex);
        }
      }
    });
  }

  @CronProdPrimaryInstance(getCronExpressionEarlyMorning())
  async updateProductsOrder(
    { categoryId, fixedProductId }: { categoryId: number, fixedProductId: number } = { categoryId: null, fixedProductId: null },
    lang: Language = adminDefaultLanguage
  ) {
    let categories: Category[];
    if (categoryId) {
      categories = [await this.categoryService.getCategoryById(categoryId, lang)];
    } else {
      categories = await this.categoryService.getAllCategories();
    }

    const variantsProp: keyof Product = 'variants';
    const salesCountProp: keyof ProductVariant = 'salesCount';
    const filterQuery: FilterQuery<Product> = { };
    if (categoryId) {
      const categoriesProp: keyof Product = 'categories';
      const idProp: keyof ProductCategory = 'id';
      filterQuery[`${categoriesProp}.${idProp}`] = categoryId;
    }
    const products = await this.productModel.find(filterQuery).sort({ [`${variantsProp}.${salesCountProp}`]: -1 }).exec();
    const changedProducts: Set<DocumentType<Product>> = new Set();

    for (const category of categories) {
      const findProductCategory = (productCategory: ProductCategory) => productCategory.id === category.id;
      const productsInCategory = products.filter(product => product.categories.some(findProductCategory));

      let reversedSortOrder: number = 1;
      for (const product of productsInCategory) {

        const handleConflict = async (sortOrder: number) => {
          const fixedProductAtThisSortOrder = productsInCategory.find(productInCategory => {
            const productCategory = productInCategory.categories.find(findProductCategory);
            return productInCategory.id !== product.id && productCategory.reversedSortOrder === sortOrder;
          });

          if (fixedProductAtThisSortOrder) {
            const incrementedSortOrder = sortOrder + 1;

            await handleConflict(incrementedSortOrder);

            fixedProductAtThisSortOrder.categories.find(findProductCategory).reversedSortOrder = incrementedSortOrder;
            changedProducts.add(fixedProductAtThisSortOrder);
          }
        }

        const productCategoryIdx = product.categories.findIndex(findProductCategory);

        if (product.id === fixedProductId) {
          await handleConflict(product.categories[productCategoryIdx].reversedSortOrder);
          continue;
        }

        const checkForAvailability = () => {
          const fixedProductAtThisSortOrder = productsInCategory.find(productInCategory => {
            const productCategory = productInCategory.categories.find(findProductCategory);
            return productCategory.reversedSortOrder === reversedSortOrder && productCategory.isSortOrderFixed;
          });

          if (fixedProductAtThisSortOrder) {
            reversedSortOrder += 1;
            checkForAvailability();
          }
        }
        checkForAvailability();

        if (!product.categories[productCategoryIdx].isSortOrderFixed) {
          product.categories[productCategoryIdx].reversedSortOrder = reversedSortOrder;
          changedProducts.add(product);
        }

        reversedSortOrder += 1;
      }
    }

    const bulk = this.productModel.collection.initializeUnorderedBulkOp();
    const changedProductIds: number[] = [];
    for (const changedProduct of changedProducts) {
      bulk.find({ _id: changedProduct.id }).updateOne(changedProduct);
      changedProductIds.push(changedProduct.id);
    }
    await bulk.execute();

    if (categoryId) {
      await this.reindexSearchDataByIds(changedProductIds);
    } else {
      await this.reindexAllSearchData();
    }
  }

  private async reindexSearchDataByIds(productIds?: number[]) {
    const spf = new AdminSPFDto();
    spf.limit = 10000;
    const products: ProductWithQty[] = await this.getProductsWithQtyByIds(productIds, spf);
    const listItems = this.transformToAdminListDto(products);
    return this.searchService.addDocuments(Product.collectionName, listItems);
  }

  private async reindexAllSearchData() { // this is called by cron from another method
    this.logger.log('Start reindex all search data');

    const spf = new AdminSPFDto();
    spf.limit = 10000;
    spf.sort = '-_id';
    const products: ProductWithQty[] = await this.getProductsWithQty(spf);
    const listItems = this.transformToAdminListDto(products);

    await this.searchService.deleteCollection(Product.collectionName);
    await this.searchService.ensureCollection(Product.collectionName, new ElasticProduct());
    await this.searchService.addDocuments(Product.collectionName, listItems);

    this.logger.log(`Finished reindex`);
  }

  async lockProductSortOrder(reorderDto: ProductReorderDto, lang: Language) {
    const session = await this.productModel.db.startSession();
    session.startTransaction();

    try {
      const product = await this.productModel.findById(reorderDto.id).session(session).exec();
      if (!product) {
        throw new BadRequestException(__('Product with id "$1" not found', lang, reorderDto.id));
      }

      const productCategoryIdx = product.categories.findIndex(c => c.id === reorderDto.categoryId);
      if (productCategoryIdx === -1) {
        throw new BadRequestException(__('Product with id "$1" is not present in category with id "$2"', lang, reorderDto.id, reorderDto.categoryId));
      }

      const targetProduct = await this.productModel.findById(reorderDto.targetId);
      if (!targetProduct) {
        throw new BadRequestException(__('Product with id "$1" not found', lang, reorderDto.targetId));
      }

      const targetProductCategory = targetProduct.categories.find(c => c.id === reorderDto.categoryId);
      if (!targetProductCategory) {
        throw new BadRequestException(__('Product with id "$1" is not present in category with id "$2"', lang, reorderDto.targetId, reorderDto.categoryId));
      }

      const targetProductOrder = targetProductCategory.reversedSortOrder || 0;
      let newOrder;
      if (reorderDto.position === ReorderPositionEnum.Start) {
        newOrder = targetProductOrder;
      } else {
        newOrder = targetProductOrder + 1;
      }

      product.categories[productCategoryIdx].reversedSortOrderBeforeFix = product.categories[productCategoryIdx].reversedSortOrder;
      product.categories[productCategoryIdx].reversedSortOrder = newOrder;
      product.categories[productCategoryIdx].isSortOrderFixed = true;

      await product.save({ session });
      await this.updateSearchDataById(reorderDto.id, lang, session);
      await session.commitTransaction();

      await this.updateProductsOrder({ categoryId: reorderDto.categoryId, fixedProductId: reorderDto.id }, lang);

    } catch (ex) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw ex;
    } finally {
      await session.endSession();
    }
  }

  async unlockProductSortOrder(unfixDto: UnfixProductOrderDto, lang: Language) {
    const session = await this.productModel.db.startSession();
    session.startTransaction();

    try {
      const product = await this.productModel.findById(unfixDto.id).session(session).exec();
      if (!product) {
        throw new BadRequestException(__('Product with id "$1" not found', lang, unfixDto.id));
      }

      const productCategoryIdx = product.categories.findIndex(c => c.id === unfixDto.categoryId);
      if (productCategoryIdx === -1) {
        throw new BadRequestException(__('Product with id "$1" is not present in category with id "$2"', lang, unfixDto.id, unfixDto.categoryId));
      }

      if (!product.categories[productCategoryIdx].isSortOrderFixed) {
        throw new BadRequestException(__('Product with id "$1" does not have fixed sort order in category with id "$2"', lang, unfixDto.id, unfixDto.categoryId));
      }

      product.categories[productCategoryIdx].reversedSortOrder = product.categories[productCategoryIdx].reversedSortOrderBeforeFix;
      product.categories[productCategoryIdx].reversedSortOrderBeforeFix = 0;
      product.categories[productCategoryIdx].isSortOrderFixed = false;
      await product.save({ session });
      await this.updateSearchDataById(unfixDto.id, lang, session);
      await session.commitTransaction();

      await this.updateProductsOrder({ categoryId: unfixDto.categoryId, fixedProductId: null }, lang);

    } catch (ex) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw ex;
    } finally {
      await session.endSession();
    }
  }

  async getReservedInventory(productId: string, variantId: string, lang: Language): Promise<ReservedInventory[]> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) { throw new BadRequestException(__('Product with id "$1" not found', lang)); }

    const variant = product.variants.find(variant => variant.id.equals(variantId));
    if (!variant) { throw new BadRequestException(`Variant with id "${variantId}" in product with id "${productId}" not found`); }

    const inventory = await this.inventoryService.getInventory(variant.sku, lang);

    return inventory.reserved;
  }

  async buildAdminFilters(spf: AdminSPFDto): Promise<IFilter[]> {
    if (!spf.hasFilters()) { return []; }

    const variantsProp = getPropertyOf<AdminProductListItemDto>('variants');
    const attributesProp = getPropertyOf<AdminProductListItemDto>('attributes');
    const valueIdsProp = getPropertyOf<AdminProductSelectedAttributeDto>('valueIds');

    const allAttributes = await this.attributeService.getAllAttributes();
    const normalized = spf.getNormalizedFilters();
    const filters: IFilter[] = [];

    for (const filter of normalized) {
      const attribute = allAttributes.find(attribute => attribute.id === filter.fieldName);
      if (!attribute) {
        filters.push(filter);
        continue;
      }
      filters.push({
        fieldName: `${attributesProp}.${valueIdsProp}|${variantsProp}.${attributesProp}.${valueIdsProp}`,
        values: filter.values
      });
    }

    return filters;
  }

  async filterListItemsByAdminSpf(
    listItems: AdminProductListItemDto[],
    spf: AdminSPFDto | AdminProductSPFDto
  ): Promise<AdminProductListItemDto[]> {

    const filters: IFilter[] = await this.getValidAttributeFilters(spf.getNormalizedFilters());
    if (!filters.length) {
      return listItems;
    }
    const filteredItems: AdminProductListItemDto[] = [];

    const isSelectedAttributesHaveFilter = (selectedAttrs: AdminProductSelectedAttributeDto[], filter: IFilter): boolean => {
      const foundSelectedAttr = selectedAttrs.find(selectedAttr => selectedAttr.attributeId === filter.fieldName);
      if (!foundSelectedAttr) { return  false; }

      const foundSelectedAttrValueId = foundSelectedAttr.valueIds.find(selectedAttrValueId => filter.values.includes(selectedAttrValueId));
      if (!foundSelectedAttrValueId) { return false; }

      return true;
    };

    for (const listItem of listItems) {
      let hasAttr: boolean = false;

      for (const filter of filters) {
        const isInRoot = isSelectedAttributesHaveFilter(listItem.attributes, filter);
        if (isInRoot) {
          hasAttr = true;
          continue;
        }

        let isInVariants: boolean = false;
        for (const variant of listItem.variants) {
          const isInVariant = isSelectedAttributesHaveFilter(variant.attributes, filter);
          if (isInVariant) {
            hasAttr = true;
            break;
          }
        }

        if (isInVariants) {
          hasAttr = true;
          continue;
        }
      }

      if (hasAttr) {
        filteredItems.push(listItem);
      }
    }

    return filteredItems;
  }
  onProductUpdate() {
    this.eventsService.emit(AdminProductService.productUpdatedEventName, {});
  }

  private async getValidAttributeFilters(filters: IFilter[], attributes?: Attribute[]): Promise<IFilter[]> {
    if (!attributes) {
      attributes = await this.attributeService.getAllAttributes();
    }

    return filters.filter(spfFilter => !!attributes.find(attribute => attribute.id === spfFilter.fieldName));
  }

  private static areProductCategoriesEqual(categories1: ProductCategory[], categories2: AdminProductCategoryDto[]): boolean {
    return areArraysEqual(categories1.map(c => c.id), categories2.map(c => c.id));
  }
}
