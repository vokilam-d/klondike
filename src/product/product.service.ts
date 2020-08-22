import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { Product } from './models/product.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { InventoryService } from '../inventory/inventory.service';
import { PageRegistryService } from '../page-registry/page-registry.service';
import { InjectModel } from '@nestjs/mongoose';
import { AdminAddOrUpdateProductDto } from '../shared/dtos/admin/product.dto';
import { CounterService } from '../shared/services/counter/counter.service';
import { FastifyRequest } from 'fastify';
import { Media } from '../shared/models/media.model';
import { AdminMediaDto } from '../shared/dtos/admin/media.dto';
import { AdminSPFDto } from '../shared/dtos/admin/spf.dto';
import { Inventory } from '../inventory/models/inventory.model';
import { getPropertyOf } from '../shared/helpers/get-property-of.function';
import { ClientSession, UpdateQuery } from 'mongoose';
import { AdminProductVariantDto } from '../shared/dtos/admin/product-variant.dto';
import { ProductReviewService } from '../reviews/product-review/product-review.service';
import { ProductVariant } from './models/product-variant.model';
import { MediaService } from '../shared/services/media/media.service';
import { CategoryService } from '../category/category.service';
import { Breadcrumb } from '../shared/models/breadcrumb.model';
import { SearchService } from '../shared/services/search/search.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { AdminProductListItemDto } from '../shared/dtos/admin/product-list-item.dto';
import { ProductWithQty } from './models/product-with-qty.model';
import { AdminProductVariantListItem } from '../shared/dtos/admin/product-variant-list-item.dto';
import { DEFAULT_CURRENCY } from '../shared/enums/currency.enum';
import { ElasticProduct } from './models/elastic-product.model';
import { CategoryTreeItem } from '../shared/dtos/shared-dtos/category.dto';
import { IFilter, SortingPaginatingFilterDto } from '../shared/dtos/shared-dtos/spf.dto';
import { ClientProductListItemDto, ClientProductVariantDto, ClientProductVariantGroupDto } from '../shared/dtos/client/product-list-item.dto';
import { AttributeService } from '../attribute/attribute.service';
import { ClientProductCategoryDto, ClientProductCharacteristic, ClientProductDto } from '../shared/dtos/client/product.dto';
import { plainToClass } from 'class-transformer';
import { ClientMediaDto } from '../shared/dtos/client/media.dto';
import { MetaTagsDto } from '../shared/dtos/shared-dtos/meta-tags.dto';
import { ClientProductSPFDto } from '../shared/dtos/client/product-spf.dto';
import { areArraysEqual } from '../shared/helpers/are-arrays-equal.function';
import { CurrencyService } from '../currency/currency.service';
import { ProductCategory } from './models/product-category.model';
import { AdminProductCategoryDto } from '../shared/dtos/admin/product-category.dto';
import { ProductReorderDto } from '../shared/dtos/admin/reorder.dto';
import { ReorderPositionEnum } from '../shared/enums/reorder-position.enum';
import { __ } from '../shared/helpers/translate/translate.function';
import { AttributeTypeEnum } from '../shared/enums/attribute-type.enum';
import { ClientProductListResponseDto } from '../shared/dtos/client/product-list-response.dto';
import { ClientFilterDto, ClientFilterValueDto } from '../shared/dtos/client/filter.dto';
import { Attribute } from '../attribute/models/attribute.model';
import { isNumber } from '../shared/helpers/is-number.function';
import { AdminProductSelectedAttributeDto } from '../shared/dtos/admin/product-selected-attribute.dto';
import { CronProdPrimaryInstance } from '../shared/decorators/primary-instance-cron.decorator';
import { CronExpression } from '@nestjs/schedule';
import { PageTypeEnum } from '../shared/enums/page-type.enum';
import { getCronExpressionEarlyMorning } from '../shared/helpers/get-cron-expression-early-morning.function';
import { ReservedInventory } from '../inventory/models/reserved-inventory.model';
import { addLeadingZeros } from '../shared/helpers/add-leading-zeros.function';
import { createClientProductId } from '../shared/helpers/client-product-id';
import { FilterCategoryDto } from '../shared/dtos/client/filter-category.dto';

interface AttributeProductCountMap {
  [attributeId: string]: {
    valuesMap: { [valueId: string]: number; };
    productCountForAttr: number;
  };
}

@Injectable()
export class ProductService implements OnApplicationBootstrap {

  private logger = new Logger(ProductService.name);
  private cachedProductCount: number;
  private filtersThresholdPercent = 25;

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

  async onApplicationBootstrap() {
    this.handleCurrencyUpdates();
    this.searchService.ensureCollection(Product.collectionName, new ElasticProduct());
    // this.reindexAllSearchData();
  }

  async getAdminProductsList(spf: AdminSPFDto, withVariants: boolean): Promise<ResponseDto<AdminProductListItemDto[]>> {

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
      pagesTotal: Math.ceil((itemsFiltered ?? itemsTotal) / spf.limit),
      itemsTotal,
      itemsFiltered
    }
  }

  async getClientProductList(spf: ClientProductSPFDto): Promise<ClientProductListResponseDto> {
    const isEnabledProp: keyof AdminProductListItemDto = 'isEnabled';

    spf[isEnabledProp] = true;

    const searchResponse = await this.findByFilters(spf);
    const adminDtos = searchResponse[0];
    const itemsTotal = searchResponse[1];
    const attributes = await this.attributeService.getAllAttributes();
    const clientDtos = await this.transformToClientListDto(adminDtos, attributes);

    return {
      data: clientDtos,
      page: spf.page,
      pagesTotal: Math.ceil(itemsTotal / spf.limit),
      itemsTotal
    }
  }

  async getClientProductListAutocomplete(query: string): Promise<ClientProductListResponseDto> {
    const spf = new ClientProductSPFDto();
    spf.limit = 5;

    const [ adminListItems ] = await this.findEnabledProductListItems(spf, { query });
    const attributes = await this.attributeService.getAllAttributes();
    const clientListItems = await this.transformToClientListDto(adminListItems, attributes);

    return {
      data: clientListItems
    };
  }

  async getClientProductListLastAdded(): Promise<ClientProductListResponseDto> {
    const spf = new ClientProductSPFDto();
    spf.limit = 5;

    const createdAtProp: keyof Product = 'createdAt';
    spf.sort = `-${createdAtProp}`;

    const [ adminListItems ] = await this.findEnabledProductListItems(spf);
    const attributes = await this.attributeService.getAllAttributes();
    const clientListItems = await this.transformToClientListDto(adminListItems, attributes);

    return {
      data: clientListItems
    };
  }

  async getClientProductListWithFilters(spf: ClientProductSPFDto): Promise<ClientProductListResponseDto> {
    // todo move logic to elastic
    // https://project-a.github.io/on-site-search-design-patterns-for-e-commerce/
    const [ adminListItems ] = await this.findEnabledProductListItems(spf, { categoryId: spf.categoryId, query: spf.q, limit: 10000 });
    const attributes = await this.attributeService.getAllAttributes();
    const spfFilters = spf
      .getNormalizedFilters()
      .filter(spfFilter => !!attributes.find(attribute => attribute.id === spfFilter.fieldName)); // leave only valid attributes

    const allSelectedAttributesProductCountMap: AttributeProductCountMap = { };

    const addPossibleAttribute = (attribute: AdminProductSelectedAttributeDto) => {
      if (!allSelectedAttributesProductCountMap[attribute.attributeId]) {
        allSelectedAttributesProductCountMap[attribute.attributeId] = {
          valuesMap: { },
          productCountForAttr: 0
        };
      }
      allSelectedAttributesProductCountMap[attribute.attributeId].productCountForAttr += 1;

      for (const valueId of attribute.valueIds) {
        if (allSelectedAttributesProductCountMap[attribute.attributeId].valuesMap[valueId] === undefined) {
          allSelectedAttributesProductCountMap[attribute.attributeId].valuesMap[valueId] = 0;
        }
      }
    }
    const incProductCount = (attributesArg: AdminProductSelectedAttributeDto[]) => {
      for (const attribute of attributesArg) {
        for (const valueId of attribute.valueIds) {
          allSelectedAttributesProductCountMap[attribute.attributeId].valuesMap[valueId] += 1;
        }
      }
    }

    let possibleMinPrice = adminListItems?.[0]?.variants[0].price || 0;
    let possibleMaxPrice = possibleMinPrice;

    let filterMinPrice: number;
    let filterMaxPrice: number;
    const split = spf.price?.split('-').map(price => parseInt(price));
    if (isNumber(split?.[0])) { filterMinPrice = split[0]; }
    if (isNumber(split?.[1])) { filterMaxPrice = split[1]; }

    let filteredAdminListItems: AdminProductListItemDto[] = [];

    for (const adminListItem of adminListItems) {
      const filteredVariants: AdminProductVariantListItem[] = [];
      let isProductAttributesSetInProductCount = false;

      for (const variant of adminListItem.variants) {
        const selectedAttributes = [ ...adminListItem.attributes, ...variant.attributes ];
        const unmatchedSelectedAttributes: AdminProductSelectedAttributeDto[] = [];
        let spfFiltersMatches: number = 0;

        for (const attribute of selectedAttributes) {
          addPossibleAttribute(attribute);
          const foundSpfFilter = spfFilters.find(spfFilter => spfFilter.fieldName === attribute.attributeId);
          if (!foundSpfFilter) { continue; }

          spfFiltersMatches += 1;
          const foundSpfFilterValue = foundSpfFilter.values.find(spfFilterValue => attribute.valueIds.includes(spfFilterValue));
          if (!foundSpfFilterValue) {
            unmatchedSelectedAttributes.push(attribute);
          }
        }

        let isPassedByPrice: boolean = true;
        if (filterMinPrice >= 0) {
          if (variant.price < filterMinPrice) {
            isPassedByPrice = false;
          }
          if (filterMaxPrice && variant.price > filterMaxPrice) {
            isPassedByPrice = false;
          }
        }

        if (spfFiltersMatches === spfFilters.length && isPassedByPrice) {
          if (unmatchedSelectedAttributes.length === 0) {
            incProductCount(variant.attributes);
            filteredVariants.push(variant);

            if (!isProductAttributesSetInProductCount) {
              incProductCount(adminListItem.attributes);
              isProductAttributesSetInProductCount = true;
            }
          } else if (unmatchedSelectedAttributes.length === 1) {
            incProductCount([unmatchedSelectedAttributes[0]]);
          }

        }

        if (variant.price < possibleMinPrice) { possibleMinPrice = variant.price; }
        if (variant.price > possibleMaxPrice) { possibleMaxPrice = variant.price; }
      }

      if (filteredVariants.length) {
        filteredAdminListItems.push({
          ...adminListItem,
          variants: filteredVariants
        });
      }
    }

    const itemsTotal = adminListItems.length;
    let itemsFiltered: number;
    if (spfFilters.length || filterMinPrice >= 0) { itemsFiltered = filteredAdminListItems.length; }

    filteredAdminListItems = filteredAdminListItems.slice(spf.skip, spf.skip + spf.limit);
    const clientListItems = await this.transformToClientListDto(filteredAdminListItems, attributes);

    let filters = this.buildClientFilters(allSelectedAttributesProductCountMap, attributes, adminListItems.length, spfFilters);
    if (itemsTotal > 0) {
      filters = this.addPriceFilter(filters, { possibleMinPrice, possibleMaxPrice, filterMinPrice, filterMaxPrice });
    }

    let filterCategories: FilterCategoryDto[] = [];
    if (spf.categoryId) {
      const allCategories = await this.categoryService.getAllCategories();
      const targetCategory = allCategories.find(category => category.id === parseInt(spf.categoryId));
      const isTargetCategoryChild = targetCategory.parentId > 0;

      for (const category of allCategories) {
        const isCurrentCategoryChild = category.parentId === parseInt(spf.categoryId);
        const isSibling = category.parentId === targetCategory.parentId && category.id !== targetCategory.id;
        const canInclude = (!isTargetCategoryChild && isCurrentCategoryChild) || (isTargetCategoryChild && isSibling);
        if (!canInclude) { continue; }

        const filterCategory = plainToClass(FilterCategoryDto, category, { excludeExtraneousValues: true });
        filterCategories.push(filterCategory);
      }
    }

    return {
      data: clientListItems,
      page: spf.page,
      pagesTotal: Math.ceil((itemsFiltered ?? itemsTotal) / spf.limit),
      itemsTotal,
      itemsFiltered,
      filters,
      categories: filterCategories
    };
  }

  async getProductsWithQty(sortingPaginating: AdminSPFDto = new AdminSPFDto()): Promise<ProductWithQty[]> {
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

  async getProductWithQtyById(id: number, session?: ClientSession): Promise<ProductWithQty> {
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
      throw new NotFoundException(__('Product with id "$1" not found', 'ru', id));
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
      throw new NotFoundException(__('Product with sku "$1" not found', 'ru', sku));
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
      throw new NotFoundException(__('Product with slug "$1" not found', 'ru', slug));
    }

    return this.transformToClientProductDto(found, slug);
  }

  async createProduct(productDto: AdminAddOrUpdateProductDto): Promise<Product> {
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
      newProductModel.id = await this.counterService.getCounter(Product.collectionName);
      await this.populateProductCategoriesAndBreadcrumbs(newProductModel);

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
      throw new NotFoundException(__('Product with id "$1" not found', 'ru', productId));
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

      if (!this.areProductCategoriesEqual(found.categories, productDto.categories)) {
        await this.populateProductCategoriesAndBreadcrumbs(productDto);
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
        throw new NotFoundException(__('Product with id "$1" not found', 'ru', productId));
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
      type: PageTypeEnum.Product
    }, session);
  }

  private updateProductPageRegistry(oldSlug: string, newSlug: string, session: ClientSession) {
    return this.pageRegistryService.updatePageRegistry(oldSlug, {
      slug: newSlug,
      type: PageTypeEnum.Product
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

  @CronProdPrimaryInstance(CronExpression.EVERY_HOUR)
  updateCachedProductCount() {
    this.productModel.estimatedDocumentCount().exec()
      .then(count => this.cachedProductCount = count)
      .catch(_ => { });
  }

  async addReviewRatingToProduct(productId: number, rating: number, isQuickRating: boolean, session?: ClientSession): Promise<any> {
    const allReviewsCountProp = getPropertyOf<Product>('allReviewsCount');
    const textReviewsCountProp = getPropertyOf<Product>('textReviewsCount');
    const ratingProp = getPropertyOf<Product>('reviewsAvgRating');

    const mongoUpdateQuery: UpdateQuery<Product> = [
      { $set: { [allReviewsCountProp]: { $toInt: { $add: [ `$${allReviewsCountProp}`, 1 ] } } } },
      {
        $set: {
          [ratingProp]: {
            $ifNull: [
              { $divide: [{ $add: [`$${ratingProp}`, rating] }, 2] },
              rating
            ]
          }
        }
      }
    ];
    if (isQuickRating === false) {
      mongoUpdateQuery.push({
        $set: { [textReviewsCountProp]: { $toInt: { $add: [ `$${textReviewsCountProp}`, 1 ] } } }
      });
    }

    await this.productModel
      .updateOne({ _id: productId as any }, mongoUpdateQuery)
      .session(session)
      .exec();

    const elasticQuery = { term: { id: productId } };
    let elasticUpdateScript = `
      ctx._source.${allReviewsCountProp} = ctx._source.${allReviewsCountProp} + 1;
      if (ctx._source.${ratingProp} == null) {
        ctx._source.${ratingProp} = ${rating};
      } else {
        ctx._source.${ratingProp} = (ctx._source.${ratingProp} + ${rating}) / 2;
      }
    `;
    if (isQuickRating === false) {
      elasticUpdateScript += `
        ctx._source.${textReviewsCountProp} = ctx._source.${textReviewsCountProp} + 1;
      `;
    }
    this.searchService.updateByQuery(Product.collectionName, elasticQuery, elasticUpdateScript).catch();
  }

  async removeReviewRatingFromProduct(productId: number, rating: number, session?: ClientSession): Promise<any> {
    const countProp = getPropertyOf<Product>('allReviewsCount');
    const ratingProp = getPropertyOf<Product>('reviewsAvgRating');

    await this.productModel
      .updateOne(
        { _id: productId as any },
        [
          { $set: { [countProp]: { $toInt: { $subtract: [ `$${countProp}`, 1 ] } } } },
          {
            $set: {
              [ratingProp]: {
                $cond: {
                  if: { $lte: [`$${countProp}`, 0]},
                  then: null,
                  else: { $subtract: [{ $multiply: [`$${ratingProp}`, 2] }, rating] }
                }
              }
            }
          }
        ]
      )
      .session(session)
      .exec();

    const elasticQuery = { term: { id: productId } };
    const elasticUpdateScript = `
      if (ctx._source.${countProp} == 0) {
        ctx._source.${ratingProp} = null;
      } else {
        ctx._source.${countProp} = ctx._source.${countProp} - 1;
        ctx._source.${ratingProp} = ctx._source.${ratingProp} - ((ctx._source.${ratingProp} * 2) - ${rating});
      }
    `;
    this.searchService.updateByQuery(Product.collectionName, elasticQuery, elasticUpdateScript).catch();
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

    return this.productModel
      .updateMany(
        { [`${categoriesProp}.${categoryIdProp}`]: categoryId },
        { $pull: { [categoriesProp]: categoryToRemove, [breadcrumbsProp]: breadcrumbToRemove } }
      )
      .session(session)
      .exec();
  }

  async updateProductCategory(categoryId: number, categoryName: string, categorySlug: string, session: ClientSession): Promise<any> {
    const categoriesProp: keyof Product = 'categories';
    const categoryIdProp: keyof ProductCategory = 'id';
    const categoryNameProp: keyof ProductCategory = 'name';
    const categorySlugProp: keyof ProductCategory = 'slug';

    await this.productModel
      .updateMany(
        { [`${categoriesProp}.${categoryIdProp}`]: categoryId },
        {
          [`${categoriesProp}.$.${categoryNameProp}`]: categoryName,
          [`${categoriesProp}.$.${categorySlugProp}`]: categorySlug
        }
      )
      .session(session)
      .exec();

    // todo remove this lines under after converting breadcrumbs to ids only
    const breadcrumbsProp = getPropertyOf<Product>('breadcrumbs');
    const idProp = getPropertyOf<Breadcrumb>('id');
    const breadcrumb = { id: categoryId, name: categoryName, slug: categorySlug };

    return this.productModel
      .updateMany(
        { [`${breadcrumbsProp}.${idProp}`]: breadcrumb.id },
        { [`${breadcrumbsProp}.$`]: breadcrumb }
      )
      .session(session)
      .exec();
  }

  private async populateProductCategoriesAndBreadcrumbs(product: Product | AdminAddOrUpdateProductDto, categoryTreeItems?): Promise<void> {
    const breadcrumbsVariants: Breadcrumb[][] = [];

    const populate = (treeItems: CategoryTreeItem[], breadcrumbs: Breadcrumb[] = []) => {

      for (const treeItem of treeItems) {
        const newBreadcrumbs: Breadcrumb[] = JSON.parse(JSON.stringify(breadcrumbs));

        const foundIdx = product.categories.findIndex(category => category.id === treeItem.id);
        if (foundIdx !== -1) {
          product.categories[foundIdx].name = treeItem.name;
          product.categories[foundIdx].slug = treeItem.slug;

          newBreadcrumbs.push({ // todo remove this after converting breadcrumbs to ids only
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

    if (!categoryTreeItems) {
      categoryTreeItems = await this.categoryService.getCategoriesTree(true);
    }
    populate(categoryTreeItems);

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

  async updateSearchDataById(productId: number, session: ClientSession): Promise<any> {
    const product = await this.getProductWithQtyById(productId, session);
    return this.updateSearchData(product);
  }

  private async deleteSearchData(productId: number): Promise<any> {
    await this.searchService.deleteDocument(Product.collectionName, productId);
  }

  private async findEnabledProductListItems(
    spf: ClientProductSPFDto,
    { categoryId, query, limit }: { categoryId?: string, query?: string, limit?: number } = { }
  ) {

    const isEnabledProp: keyof AdminProductListItemDto = 'isEnabled';
    const filters: IFilter[] = [{ fieldName: isEnabledProp, values: [true] }];

    if (categoryId) {
      const categoriesProp: keyof AdminProductListItemDto = 'categories';
      const categoryIdProp: keyof AdminProductCategoryDto = 'id';
      filters.push({ fieldName: `${categoriesProp}.${categoryIdProp}`, values: [categoryId] });
    }
    if (query) {
      const variantsProp: keyof AdminProductListItemDto = 'variants';
      const nameProp: keyof AdminProductVariantListItem = 'name';
      const skuProp: keyof AdminProductVariantListItem = 'sku';
      const vendorCodeProp: keyof AdminProductVariantListItem = 'vendorCode';

      const namePropPath = `${variantsProp}.${nameProp}`;
      const skuPropPath = `${variantsProp}.${skuProp}`;
      const vendorCodePath = `${variantsProp}.${vendorCodeProp}`;

      const fieldName = [namePropPath, skuPropPath, vendorCodePath].join('|');

      filters.push({ fieldName, values: [query] });
    }

    return this.searchService.searchByFilters<AdminProductListItemDto>(
      Product.collectionName,
      filters,
      undefined,
      limit || spf.limit,
      spf.getSortAsObj(),
      spf.sortFilter,
      new ElasticProduct()
    );
  }

  private async findByFilters(spf: SortingPaginatingFilterDto) {
    return this.searchService.searchByFilters<AdminProductListItemDto>(
      Product.collectionName,
      spf.getNormalizedFilters(),
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
      const variants: AdminProductVariantListItem[] = [];
      let productMediaUrl: string = null;

      product.variants.forEach(variant => {
        skus.push(variant.sku);
        if (variant.vendorCode) { vendorCodes.push(variant.vendorCode); }
        prices.push(`${variant.priceInDefaultCurrency} ${DEFAULT_CURRENCY}`);
        quantitiesInStock.push(variant.qtyInStock);
        sellableQuantities.push(variant.qtyInStock - variant.reserved?.reduce((sum, ordered) => sum + ordered.qty, 0));

        let primaryMediaUrl;
        let secondaryMediaUrl;
        let mediaAltText;
        variant.medias.forEach(media => {
          if (!productMediaUrl) { productMediaUrl = media.variantsUrls.small; }

          if (media.isHidden) { return; }

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
          name: variant.name,
          slug: variant.slug,
          attributes: variant.attributes,
          sku: variant.sku,
          vendorCode: variant.vendorCode,
          price: variant.price,
          oldPrice: variant.oldPrice,
          currency: variant.currency,
          priceInDefaultCurrency: variant.priceInDefaultCurrency,
          oldPriceInDefaultCurrency: variant.oldPriceInDefaultCurrency,
          qtyInStock: variant.qtyInStock,
          sellableQty: variant.qtyInStock - variant.reserved?.reduce((sum, ordered) => sum + ordered.qty, 0),
        });
      });

      return {
        id: product._id,
        categories: product.categories,
        name: product.name,
        attributes: product.attributes,
        isEnabled: product.isEnabled,
        skus: skus.join(', '),
        vendorCodes: vendorCodes.join(', '),
        prices: prices.join(', '),
        quantitiesInStock: quantitiesInStock.join(', '),
        sellableQuantities: sellableQuantities.join(', '),
        mediaUrl: productMediaUrl,
        allReviewsCount: product.allReviewsCount,
        textReviewsCount: product.textReviewsCount,
        reviewsAvgRating: product.reviewsAvgRating,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        variants
      };
    });
  }

  private async transformToClientListDto(
    adminListItemDtos: AdminProductListItemDto[],
    attributes: Attribute[]
  ): Promise<ClientProductListItemDto[]> {

    return adminListItemDtos.map(product => {
      const variant = product.variants[0]; // todo add flag in ProductVariant to select here default variant?

      const variantGroups: ClientProductVariantGroupDto[] = [];
      if (product.variants.length > 1) {
        product.variants.forEach(variant => {
          variant.attributes.forEach(selectedAttr => {
            const attribute = attributes.find(a => a.id === selectedAttr.attributeId);
            if (!attribute || attribute.type === AttributeTypeEnum.MultiSelect) { return; }

            const attrLabel = attribute.label;
            const attrValue = attribute.values.find(v => v.id === selectedAttr.valueIds[0]);
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
        id: createClientProductId(product.id, variant.id.toString()),
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
        allReviewsCount: product.allReviewsCount,
        textReviewsCount: product.textReviewsCount,
        reviewsAvgRating: product.reviewsAvgRating
      }
    });
  }

  async transformToClientProductDto(productWithQty: ProductWithQty, slug: string): Promise<ClientProductDto> {
    const variant = productWithQty.variants.find(v => v.slug === slug);

    const categories: ClientProductCategoryDto[] = productWithQty.categories.map(category => {
      const { sortOrder, ...rest } = category;
      return rest;
    });

    const variantGroups: ClientProductVariantGroupDto[] = [];
    const attributeModels = await this.attributeService.getAllAttributes();
    if (productWithQty.variants.length > 1) {
      productWithQty.variants.forEach(variant => {
        variant.attributes.forEach(selectedAttr => {
          const attribute = attributeModels.find(a => a.id === selectedAttr.attributeId);
          if (!attribute || attribute.type === AttributeTypeEnum.MultiSelect) { return; }

          const attrLabel = attribute.label;
          const attrValue = attribute.values.find(v => selectedAttr.valueIds.includes(v.id));
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
      if (!foundAttr || !foundAttr.isVisibleInProduct) { continue; }
      const foundAttrValues = foundAttr.values.filter(v => attribute.valueIds.includes(v.id));
      if (!foundAttrValues.length) { continue; }

      const value = foundAttrValues.map(value => value.label).join(', ');
      characteristics.push({ label: foundAttr.label, code: foundAttr._id, value });
    }

    return {
      id: createClientProductId(productWithQty._id, variant._id.toString()),
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
      allReviewsCount: productWithQty.allReviewsCount,
      textReviewsCount: productWithQty.textReviewsCount,
      relatedProducts: variant.relatedProducts
        .sort(((a, b) => b.sortOrder - a.sortOrder))
        .map(p => ({ productId: p.productId, variantId: p.variantId.toString() }))
    }
  }

  @CronProdPrimaryInstance(getCronExpressionEarlyMorning())
  private async reindexAllSearchData() {
    this.logger.log('Start reindex all search data');

    await this.searchService.deleteCollection(Product.collectionName);
    await this.searchService.ensureCollection(Product.collectionName, new ElasticProduct());

    const spf = new AdminSPFDto();
    spf.limit = 10000;
    const products = await this.getProductsWithQty(spf);
    const listItems = this.transformToAdminListDto(products);

    for (const batch of getBatches(listItems, 20)) {
      await Promise.all(batch.map(listItem => this.searchService.addDocument(Product.collectionName, listItem.id, listItem)));
      this.logger.log(`Reindexed ids: ${batch.map(i => i.id).join()}`);
    }

    function getBatches<T = any>(arr: T[], size: number = 2): T[][] {
      const result = [];
      for (let i = 0; i < arr.length; i++) {
        if (i % size !== 0) {
          continue;
        }

        const resultItem = [];
        for (let k = 0; (resultItem.length < size && arr[i + k]); k++) {
          resultItem.push(arr[i + k]);
        }
        result.push(resultItem);
      }

      return result;
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

  private areProductCategoriesEqual(categories1: ProductCategory[], categories2: AdminProductCategoryDto[]): boolean {
    return areArraysEqual(categories1.map(c => c.id), categories2.map(c => c.id));
  }

  async reorderProduct(reorderDto: ProductReorderDto) { // todo this method is ugly, do separation on repositories
    const product = await this.productModel.findById(reorderDto.id).exec();
    if (!product) { throw new BadRequestException(__('Product with id "$1" not found', 'ru', reorderDto.id)); }

    const targetProduct = await this.productModel.findById(reorderDto.targetId);
    if (!targetProduct) { throw new BadRequestException(__('Product with id "$1" not found', 'ru', reorderDto.targetId)); }

    const targetProductOrder = targetProduct.categories.find(c => c.id === reorderDto.categoryId)?.sortOrder || 0;

    const session = await this.productModel.db.startSession();
    session.startTransaction();

    try {
      let filterOperator;
      let elasticComparisonOperator;
      let newOrder;
      if (reorderDto.position === ReorderPositionEnum.Start) {
        filterOperator = '$gt';
        elasticComparisonOperator = '>';
        newOrder = targetProductOrder + 1;
      } else {
        filterOperator = '$gte';
        elasticComparisonOperator = '>=';
        newOrder = targetProductOrder;
      }

      const categoriesProp: keyof Product = 'categories';
      const categoryIdProp: keyof ProductCategory = 'id';
      const sortProp: keyof ProductCategory = 'sortOrder';
      await this.productModel.updateMany(
        {
          '_id': { $ne: reorderDto.id },
          categories: {
            $elemMatch: {
              [categoryIdProp]: reorderDto.categoryId,
              [sortProp]: { [filterOperator]: targetProductOrder }
            }
          }
        },
        {
          $inc: { [`${categoriesProp}.$.${sortProp}`]: 1 }
        }
      ).session(session).exec();

      const productCategoryIdx = product.categories.findIndex(c => c.id === reorderDto.categoryId);
      product.categories[productCategoryIdx].sortOrder = newOrder;
      await product.save({ session });
      await session.commitTransaction();

      const elasticQuery = {
        nested: {
          path: categoriesProp,
          query: {
            term: { [`${categoriesProp}.${categoryIdProp}`]: reorderDto.categoryId }
          }
        }
      };
      const elasticUpdateScript = `
        ctx._source.${categoriesProp}.forEach(category -> {
          if (
            ctx._source.id != ${product.id}
            && category.${categoryIdProp} == ${reorderDto.categoryId}
            && category.${sortProp} ${elasticComparisonOperator} ${targetProductOrder}
          ) {
            category.${sortProp} += 1;
          } else if (ctx._source.id == ${product.id} && category.${categoryIdProp} == ${reorderDto.categoryId}) {
            category.${sortProp} = ${newOrder}
          }
          return category;
        })
      `;
      await this.searchService.updateByQuery(Product.collectionName, elasticQuery, elasticUpdateScript);

    } catch (ex) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw ex;
    } finally {
      await session.endSession();
    }
  }

  async turnOverProductSortOrder() {
    const session = await this.productModel.db.startSession();
    session.startTransaction();

    try {
      const categories = await this.categoryService.getAllCategories();
      for (let k = 0; k < categories.length; k++) {
        const categoryId = categories[k]._id;
        if (categoryId === 11) { continue; }
        let products = await this.productModel.find({ 'categories.id': categoryId });
        products = products
          .filter(p => {
            const foundCatsIdx = p.categories.findIndex(c => c.id === categoryId);
            if (foundCatsIdx === -1 || p.categories[foundCatsIdx].sortOrder === 0) {
              return false;
            }
            return true;
          })
          .sort((a, b) => {
            const aCatIdx = a.categories.findIndex(c => c.id === categoryId);
            const bCatIdx = b.categories.findIndex(c => c.id === categoryId);
            return b.categories[bCatIdx].sortOrder - a.categories[aCatIdx].sortOrder;
          });

        const end = Math.floor(products.length / 2);

        for (let i = 0; i < end; i++) {
          const product = products[i];
          const productCategoryIdx = product.categories.findIndex(c => c.id === categoryId);

          const mirror = products[products.length - 1 - i];
          const mirrorCategoryIdx = mirror.categories.findIndex(c => c.id === categoryId);
          const mirrorCategoryOrder = mirror.categories[mirrorCategoryIdx].sortOrder;

          mirror.categories[mirrorCategoryIdx].sortOrder = product.categories[productCategoryIdx].sortOrder;
          product.categories[productCategoryIdx].sortOrder = mirrorCategoryOrder;

          await product.save();
          await mirror.save();
        }

        console.log(`Finished categories: (${k + 1} of ${categories.length})`);
      }

      await session.commitTransaction();

      await this.reindexAllSearchData();
    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      await session.endSession();
    }
  }

  private buildClientFilters(
    attributeProductCountMap: AttributeProductCountMap,
    attributes: Attribute[],
    totalFound: number,
    spfFilters: IFilter[]
  ): ClientFilterDto[] {

    const clientFilters: ClientFilterDto[] = [];

    Object.keys(attributeProductCountMap).forEach(attributeId => {
      const { valuesMap, productCountForAttr } = attributeProductCountMap[attributeId];
      if ((productCountForAttr / totalFound) < (this.filtersThresholdPercent / 100)) { return; }

      const attribute = attributes.find(attribute => attribute.id === attributeId);
      if (!attribute || !attribute.isVisibleInFilters) { return; }

      const spfFilter = spfFilters.find(spfFilter => spfFilter.fieldName === attributeId);

      const values: ClientFilterValueDto[] = [];
      let valuesProductsCount = 0;
      let isSortable: boolean = true;
      Object.entries(valuesMap).forEach(([ valueId, productsCount ]) => {
        const attributeValue = attribute.values.find(value => value.id === valueId);
        if (!attributeValue) { return; }

        let isSelected = false;
        if (spfFilter) {
          isSelected = spfFilter.values.includes(valueId);
        }

        if (attributeValue.label.startsWith('№')) {
          isSortable = false;
        }

        valuesProductsCount += productsCount;

        values.push({
          id: attributeValue.id,
          label: attributeValue.label,
          isDisabled: productsCount === 0,
          productsCount,
          isSelected
        });
      });

      if (values.length <= 1) { return; }

      if (isSortable) {
        values.sort(((a, b) => a.label > b.label ? 1 : -1));
      }

      clientFilters.push({
        id: attribute.id,
        label: attribute.label,
        isDisabled: valuesProductsCount === 0,
        type: 'checkbox',
        values
      });
    });

    return clientFilters;
  }

  private addPriceFilter(
    clientFilters: ClientFilterDto[],
    prices: {
      possibleMinPrice: number;
      possibleMaxPrice: number;
      filterMinPrice: number;
      filterMaxPrice: number;
    }
  ): ClientFilterDto[] {

    const priceFilterSortIndex = 1;
    const rangeMin = Math.floor(prices.possibleMinPrice);
    const rangeMax = Math.ceil(prices.possibleMaxPrice);

    clientFilters.splice(priceFilterSortIndex, 0, {
      id: 'price',
      label: 'Цена',
      isDisabled: false,
      type: 'range',
      rangeValues: {
        range: {
          min: rangeMin,
          max: rangeMax
        },
        selected: {
          min: prices.filterMinPrice || rangeMin,
          max: prices.filterMaxPrice || rangeMax
        }
      }
    });

    return clientFilters;
  }

  async getReservedInventory(productId: string, variantId: string): Promise<ReservedInventory[]> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) { throw new BadRequestException(__('Product with id "$1" not found', 'ru')); }

    const variant = product.variants.find(variant => variant.id.equals(variantId));
    if (!variant) { throw new BadRequestException(`Variant with id "${variantId}" in product with id "${productId}" not found`); }

    const inventory = await this.inventoryService.getInventory(variant.sku);

    return inventory.reserved;
  }
}
