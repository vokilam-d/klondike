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
import { SearchService } from '../../shared/services/search/search.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { AdminProductListItemDto } from '../../shared/dtos/admin/product-list-item.dto';
import { ProductWithQty } from '../models/product-with-qty.model';
import { AdminProductVariantListItemDto } from '../../shared/dtos/admin/product-variant-list-item.dto';
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
import { Language } from '../../shared/enums/language.enum';
import { EventsService } from '../../shared/services/events/events.service';
import { adminDefaultLanguage } from '../../shared/constants';
import { AdminProductSPFDto } from '../../shared/dtos/admin/product-spf.dto';
import { BreadcrumbsVariant } from '../../shared/models/breadcrumbs-variant.model';
import { AdminProductListItemCategoryDto } from '../../shared/dtos/admin/product-list-item-category.dto';
import { User } from '../../user/models/user.model';
import { getProductChangesMessage } from '../../shared/helpers/get-product-changes-message.function';

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
    this.searchService.ensureCollection(Product.collectionName, new ElasticProduct()).then();
    this.handleCurrencyUpdates();
    // this.reindexAllSearchData();

    // const products = await this.productModel.find().exec();
    // for (const product of products) {
    //   console.log('start product', product.id);
    //   for (const variant of product.variants) {
    //     variant.medias = await this.mediaService.setSquare(variant.medias, Product.collectionName);
    //   }
    //   await product.updateOne(product);
    //   console.log('saved product', product.id);
    // }
    // console.log('saved all');
    // this.reindexAllSearchData();
  }

  async setSquare() {

    const products = await this.productModel.find().exec();
    for (const product of products) {
      console.log('start product', product.id);
      for (const variant of product.variants) {
        variant.medias = await this.mediaService.setSquare(variant.medias, Product.collectionName);
      }
      await product.updateOne(product);
      console.log('saved product', product.id);
    }
    console.log('saved all');
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
      .allowDiskUse(true)
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
      .allowDiskUse(true)
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

  async getAdminProduct(id: number, lang: Language, session?: ClientSession): Promise<ProductWithQty> {
    const productWithQty = await this.getProductWithQtyById(id, lang, session);
    const skus = productWithQty.variants.map(variant => variant.sku);
    const inventories = await this.inventoryService.getInventories(skus, lang, session);
    const logs = inventories.flatMap(inventory => inventory.logs);
    productWithQty.logs.push(...logs);
    productWithQty.logs.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return productWithQty;
  }

  async getProductWithQtyById(id: number, lang: Language, session?: ClientSession): Promise<ProductWithQty> {
    const variantsProp = getPropertyOf<Product>('variants');
    const skuProp = getPropertyOf<Inventory>('sku');
    const qtyProp = getPropertyOf<Inventory>('qtyInStock');
    const reservedProp: keyof Inventory = 'reserved';

    const [ found ] = await this.productModel.aggregate()
      .allowDiskUse(true)
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
      .allowDiskUse(true)
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

    return this.productModel.aggregate()
      .allowDiskUse(true)
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
  }

  async createProduct(productDto: AdminAddOrUpdateProductDto, lang: Language, user: DocumentType<User>): Promise<Product> {
    const session = await this.productModel.db.startSession();
    session.startTransaction();

    try {
      const inventories: Inventory[] = [];

      for (const dtoVariant of productDto.variants) {
        const skuCounter = await this.counterService.getCounter('sku', session);
        dtoVariant.sku = addLeadingZeros(skuCounter, 5);
      }

      const newProductModel = new this.productModel(productDto);
      newProductModel.id = await this.counterService.getCounter(Product.collectionName, session);
      newProductModel.breadcrumbsVariants = await this.buildBreadcrumbsVariants(newProductModel.categories);

      for (const dtoVariant of productDto.variants) {
        const inventory = await this.inventoryService.createInventory(dtoVariant.sku, newProductModel.id, dtoVariant.qtyInStock, session, user);
        inventories.push(inventory.toJSON());
        await this.createProductPageRegistry(dtoVariant.slug, session);
      }

      if (newProductModel.variants.every(variant => variant.isEnabled === false)) {
        newProductModel.isEnabled = false;
      }

      AdminProductService.addLog(newProductModel, `Product created, userLogin=${user?.login}`);

      await this.setProductPrices(newProductModel, lang);
      await newProductModel.save({ session });
      const productWithQty = this.transformToProductWithQty(newProductModel.toJSON(), inventories);
      await this.addSearchData(productWithQty);
      await session.commitTransaction();

      this.onProductUpdate();

      return productWithQty;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async updateProduct(productId: number, productDto: AdminAddOrUpdateProductDto, lang: Language, user: DocumentType<User>): Promise<Product> {
    const found = await this.productModel.findById(productId).exec();
    if (!found) {
      throw new NotFoundException(__('Product with id "$1" not found', lang, productId));
    }

    const areProductCategoriesEqual = AdminProductService.areProductCategoriesEqual(found.categories, productDto.categories);

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
        await this.createProductPageRegistry(variantDto.slug, session);
        const inventory = await this.inventoryService.createInventory(variantDto.sku, found.id, variantDto.qtyInStock, session, user);
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

        if (variant.slug !== variantInDto.slug) {
          await this.updateProductPageRegistry(variant.slug, variantInDto.slug, variantInDto.createRedirect, session);
        }
        const inventory = await this.inventoryService.updateInventory(variant.sku, variantInDto.qtyInStock, lang, session, user);
        inventories.push(inventory.toJSON());
      }

      const logUpdateMessage = getProductChangesMessage(found, productDto);

      Object.keys(productDto).forEach(key => { found[key] = productDto[key]; });

      AdminProductService.addLog(found, `Product updated, ${logUpdateMessage}, userLogin=${user?.login}`);

      if (found.variants.every(variant => variant.isEnabled === false)) {
        found.isEnabled = false;
      }

      if (!areProductCategoriesEqual) {
        found.breadcrumbsVariants = await this.buildBreadcrumbsVariants(productDto.categories);
        AdminProductService.addLog(found, `Rebuilt breadcrumbs after product categories update, userLogin=${user?.login}`);
      }

      await this.setProductPrices(found, lang);
      found.updatedAt = new Date();
      await found.save({ session });
      const productWithQty = this.transformToProductWithQty(found.toJSON(), inventories);
      await this.updateSearchData(productWithQty);
      await session.commitTransaction();

      this.onProductUpdate();
      await this.mediaService.deleteMedias(mediasToDelete, Product.collectionName);

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
      await this.mediaService.deleteMedias(mediasToDelete, Product.collectionName);

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

    AdminProductService.addLog(product, `Updated review info, reviewsAvgRating=${reviewsAvgRating}, textReviewsCount=${textReviewsCount}, allReviewsCount=${allReviewsCount}`);

    await product.save({ session });
    await this.updateSearchDataById(productId, lang, session);
    this.onProductUpdate();
  }

  async incrementSalesCount(productId: number, variantId: string, count: number, session: ClientSession, user?: User): Promise<any> {
    const logsProp = getPropertyOf<Product>('logs');
    const variantsProp = getPropertyOf<Product>('variants');
    const countProp = getPropertyOf<ProductVariant>('salesCount');

    let logMessage = `Incremented sales count by "${count}"`;
    if (user) {
      logMessage += `, userLogin=${user.login}`;
    } else {
      logMessage += `, source=system`;
    }

    return this.productModel
      .updateOne(
        { _id: productId as any, [`${variantsProp}._id`]: variantId as any },
        {
          $inc: { [`${variantsProp}.$.${countProp}`]: count },
          $push: { [logsProp]: { time: new Date(), text: logMessage } }
        }
      )
      .session(session)
      .exec();
  }

  async handleCategoryDeletion(categoryId: number, session: ClientSession, user: DocumentType<User>): Promise<void> {
    const categoriesProp: keyof Product = 'categories';
    const categoryIdProp: keyof ProductCategory = 'id';
    const products = await this.productModel.find({ [`${categoriesProp}.${categoryIdProp}`]: categoryId }).session(session).exec();

    if (!products.length) {
      return;
    }

    const allCategories = await this.categoryService.getAllCategories({ session });
    for (const product of products) {
      const productCategoryIdx = product.categories.findIndex(productCategory => productCategory.id === categoryId);
      product.categories.splice(productCategoryIdx, 1);
      product.breadcrumbsVariants = await this.buildBreadcrumbsVariants(product.categories, allCategories);

      AdminProductService.addLog(product, `Deleted category with id "${categoryId}" and rebuilt breadcrumbs, userLogin=${user?.login}`);

      await product.save({ session });
      await this.updateSearchDataById(product.id, adminDefaultLanguage, session);
    }

    this.onProductUpdate();
  }

  async rebuildBreadcrumbsRelatedToCategory(
    categoryId: string,
    categories: Category[],
    session: ClientSession,
    user: DocumentType<User>
  ): Promise<void> {
    const categoriesProp: keyof Product = 'categories';
    const categoryIdProp: keyof ProductCategory = 'id';

    const products = await this.productModel.find({ [`${categoriesProp}.${categoryIdProp}`]: categoryId }).session(session).exec();
    for (const product of products) {
      product.breadcrumbsVariants = await this.buildBreadcrumbsVariants(product.categories, categories);

      AdminProductService.addLog(product, `Rebuilt breadcrumbs after category "${categoryId}" reorder, userLogin=${user?.login}`);

      await product.save({ session });
    }
    this.onProductUpdate();
  }

  private async buildBreadcrumbsVariants(productCategories: ProductCategory[], allCategories?: Category[]): Promise<BreadcrumbsVariant[]> {
    const breadcrumbsVariants: BreadcrumbsVariant[] = [];

    if (!allCategories) {
      allCategories = await this.categoryService.getAllCategories();
    }

    for (const productCategory of productCategories) {
      let category = allCategories.find(cat => cat.id === productCategory.id);
      if (!category) {
        continue;
      }

      const categoryIds: number[] = [];
      categoryIds.push(category.id);
      while (category.parentId) {
        const foundParent = allCategories.find(cat => cat.id === category.parentId);
        if (!foundParent) {
          break;
        }
        categoryIds.unshift(foundParent.id);
        category = foundParent;
      }

      breadcrumbsVariants.push({
        isActive: false,
        categoryIds
      });
    }

    breadcrumbsVariants.sort((a, b) => b.categoryIds.length - a.categoryIds.length);
    if (breadcrumbsVariants[0]) {
      breadcrumbsVariants[0].isActive = true;
    }

    return breadcrumbsVariants;
  }

  private async addSearchData(productWithQty: ProductWithQty) {
    const [ adminListItem ] = await this.transformToAdminListDto([productWithQty]);
    await this.searchService.addDocument(Product.collectionName, productWithQty.id, adminListItem);
  }

  private async updateSearchData(productWithQty: ProductWithQty): Promise<any> {
    const [ adminListItem ] = await this.transformToAdminListDto([productWithQty]);
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

  private async transformToAdminListDto(products: ProductWithQty[]): Promise<AdminProductListItemDto[]> {
    const productListItemDtos: AdminProductListItemDto[] = [];

    const allCategories: Category[] = await this.categoryService.getAllCategories();

    for (const product of products) {
      const variants: AdminProductVariantListItemDto[] = [];
      let salesCount: number = 0;
      let productMediaUrl: string = null;

      for (const variant of product.variants) {
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

      const categories: AdminProductListItemCategoryDto[] = product.categories.map(productCategory => {
        const category = allCategories.find(category => category.id === productCategory.id);
        return {
          name: category.name,
          slug: category.slug,
          id: category.id,
          reversedSortOrder: productCategory.reversedSortOrder,
          isSortOrderFixed: productCategory.isSortOrderFixed,
          reversedSortOrderBeforeFix: productCategory.reversedSortOrderBeforeFix
        };
      })

      productListItemDtos.push({
        id: product._id,
        categories,
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
      });
    }

    return productListItemDtos;
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
        const query = { [`${variantsProp}.${currencyProp}`]: currency._id };
        const products = await this.productModel.find(query).exec();
        for (const product of products) {
          let logMessage = `Updated prices after "${currency._id}" exchange rate update, newExchangeRate=${currency.exchangeRate}`;

          for (const variant of product.variants) {
            if (variant.currency !== currency._id) {
              continue;
            }

            const prevPriceInDefaultCurrency = variant.priceInDefaultCurrency;
            variant.priceInDefaultCurrency = Math.ceil(variant.price * currency.exchangeRate);
            if (prevPriceInDefaultCurrency !== variant.priceInDefaultCurrency) {
              logMessage += `, ${variant.sku}_prevPriceInDefaultCurrency=${prevPriceInDefaultCurrency}, ${variant.sku}_newPriceInDefaultCurrency=${variant.priceInDefaultCurrency}`;
            }

            if (variant.oldPrice) {
              const prevOldPriceInDefaultCurrency = variant.oldPriceInDefaultCurrency;
              variant.oldPriceInDefaultCurrency = Math.ceil(variant.oldPrice * currency.exchangeRate);

              if (prevOldPriceInDefaultCurrency !== variant.oldPriceInDefaultCurrency) {
                logMessage += `, ${variant.sku}_prevOldPriceInDefaultCurrency=${prevOldPriceInDefaultCurrency}, ${variant.sku}_newOldPriceInDefaultCurrency=${variant.oldPriceInDefaultCurrency}`;
              }
            }
          }

          AdminProductService.addLog(product, `${logMessage}, source=system`);

          await product.save();
        }

        try {
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
    lang: Language = adminDefaultLanguage,
    user?: DocumentType<User>
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
          const oldReversedSortOrder = product.categories[productCategoryIdx].reversedSortOrder;
          if (oldReversedSortOrder !== reversedSortOrder) {
            product.categories[productCategoryIdx].reversedSortOrder = reversedSortOrder;
            changedProducts.add(product);
          }
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
    const listItems = await this.transformToAdminListDto(products);
    return this.searchService.addDocuments(Product.collectionName, listItems);
  }

  private async reindexAllSearchData() { // this is called by cron from another method
    this.logger.log('Start reindex all search data');

    const spf = new AdminSPFDto();
    spf.limit = 10000;
    spf.sort = '-_id';
    const products: ProductWithQty[] = await this.getProductsWithQty(spf);
    const listItems = await this.transformToAdminListDto(products);

    await this.searchService.deleteCollection(Product.collectionName);
    await this.searchService.ensureCollection(Product.collectionName, new ElasticProduct());
    await this.searchService.addDocuments(Product.collectionName, listItems);

    this.logger.log(`Finished reindex`);
  }

  async lockProductSortOrder(reorderDto: ProductReorderDto, lang: Language, user: DocumentType<User>) {
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

      AdminProductService.addLog(product, `Locked sort order, categoryId=${reorderDto.categoryId}, reversedSortOrderBeforeFix=${product.categories[productCategoryIdx].reversedSortOrderBeforeFix}, reversedSortOrder=${product.categories[productCategoryIdx].reversedSortOrder} userLogin=${user?.login}`);

      await product.save({ session });
      await this.updateSearchDataById(reorderDto.id, lang, session);
      await session.commitTransaction();

      await this.updateProductsOrder({ categoryId: reorderDto.categoryId, fixedProductId: reorderDto.id }, lang, user);

    } catch (ex) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw ex;
    } finally {
      await session.endSession();
    }
  }

  async unlockProductSortOrder(unfixDto: UnfixProductOrderDto, lang: Language, user: DocumentType<User>) {
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

      AdminProductService.addLog(product, `Unlocked sort order, categoryId=${unfixDto.categoryId}, reversedSortOrder=${product.categories[productCategoryIdx].reversedSortOrder} userLogin=${user?.login}`);

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
      if (!foundSelectedAttr) { return false; }

      const foundSelectedAttrValueId = foundSelectedAttr.valueIds.find(selectedAttrValueId => filter.values.includes(selectedAttrValueId));
      return !!foundSelectedAttrValueId;
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

  private static addLog(product: Product, message: string): void {
    product.logs.push({ time: new Date(), text: message });
  }
}
