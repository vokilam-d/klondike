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
import { ClientProductListItemDto, ClientProductVariantDto, ClientProductVariantGroupDto } from '../../shared/dtos/client/product-list-item.dto';
import { AttributeService } from '../../attribute/attribute.service';
import { ClientProductCategoryDto, ClientProductCharacteristic, ClientProductDto } from '../../shared/dtos/client/product.dto';
import { plainToClass } from 'class-transformer';
import { ClientMediaDto } from '../../shared/dtos/client/media.dto';
import { ClientProductSPFDto } from '../../shared/dtos/client/product-spf.dto';
import { areArraysEqual } from '../../shared/helpers/are-arrays-equal.function';
import { CurrencyService } from '../../currency/currency.service';
import { ProductCategory } from '../models/product-category.model';
import { AdminProductCategoryDto } from '../../shared/dtos/admin/product-category.dto';
import { ProductReorderDto } from '../../shared/dtos/admin/reorder.dto';
import { ReorderPositionEnum } from '../../shared/enums/reorder-position.enum';
import { __ } from '../../shared/helpers/translate/translate.function';
import { AttributeTypeEnum } from '../../shared/enums/attribute-type.enum';
import { ClientProductListResponseDto } from '../../shared/dtos/client/product-list-response.dto';
import { ClientFilterDto, ClientFilterValueDto } from '../../shared/dtos/client/filter.dto';
import { Attribute } from '../../attribute/models/attribute.model';
import { isNumber } from '../../shared/helpers/is-number.function';
import { AdminProductSelectedAttributeDto } from '../../shared/dtos/admin/product-selected-attribute.dto';
import { CronProdPrimaryInstance } from '../../shared/decorators/primary-instance-cron.decorator';
import { CronExpression } from '@nestjs/schedule';
import { PageTypeEnum } from '../../shared/enums/page-type.enum';
import { getCronExpressionEarlyMorning } from '../../shared/helpers/get-cron-expression-early-morning.function';
import { ReservedInventory } from '../../inventory/models/reserved-inventory.model';
import { addLeadingZeros } from '../../shared/helpers/add-leading-zeros.function';
import { createClientProductId } from '../../shared/helpers/client-product-id';
import { UnfixProductOrderDto } from '../../shared/dtos/admin/unfix-product-order.dto';
import { Category } from '../../category/models/category.model';
import { sortByLabel } from '../../shared/helpers/sort-by-label.function';
import { MultilingualText } from '../../shared/models/multilingual-text.model';
import { ClientMetaTagsDto } from '../../shared/dtos/client/meta-tags.dto';
import { AdminCategoryTreeItemDto } from '../../shared/dtos/admin/category-tree-item.dto';
import { Language } from '../../shared/enums/language.enum';
import { ClientBreadcrumbDto } from '../../shared/dtos/client/breadcrumb.dto';
import { googleTranslate } from '../../shared/helpers/translate/google-translate';
import { FileLogger } from '../../logger/file-logger.service';

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
    private readonly pageRegistryService: PageRegistryService
  ) { }

  async onApplicationBootstrap() {
    this.handleCurrencyUpdates();
    this.searchService.ensureCollection(Product.collectionName, new ElasticProduct());
    // this.reindexAllSearchData();
  }

  async getAdminProductsList(spf: AdminSPFDto, withVariants: boolean): Promise<ResponseDto<AdminProductListItemDto[]>> {

    const filters = await this.buildAdminFilters(spf);
    let [ products, itemsFiltered ] = await this.findByFilters(spf, filters);
    const itemsTotal = await this.countProducts();

    if (!withVariants) {
      products = products.map(({ variants, ...product }) => product);
    }

    return {
      data: products,
      page: spf.page,
      pagesTotal: Math.ceil((itemsTotal) / spf.limit),
      itemsTotal,
      itemsFiltered: spf.hasFilters() ? itemsFiltered : undefined
    };
  }

  async getClientProductList(spf: ClientProductSPFDto, lang: Language): Promise<ClientProductListResponseDto> {
    const isEnabledProp: keyof AdminProductListItemDto = 'isEnabled';

    spf[isEnabledProp] = true;

    const searchResponse = await this.findByFilters(spf, spf.getNormalizedFilters());
    const adminDtos = searchResponse[0];
    const itemsTotal = searchResponse[1];
    const attributes = await this.attributeService.getAllAttributes();
    const clientDtos = await this.transformToClientListDto(adminDtos, attributes, lang);

    return {
      data: clientDtos,
      page: spf.page,
      pagesTotal: Math.ceil(itemsTotal / spf.limit),
      itemsTotal
    }
  }

  async getClientProductListAutocomplete(query: string, lang: Language): Promise<ClientProductListItemDto[]> {
    const spf = new ClientProductSPFDto();
    spf.limit = 5;

    const [ adminListItems ] = await this.findEnabledProductListItems(spf, lang, { query });
    const attributes = await this.attributeService.getAllAttributes();
    const clientListItems = await this.transformToClientListDto(adminListItems, attributes, lang);

    return clientListItems;
  }

  async getClientProductListLastAdded(lang: Language): Promise<ClientProductListResponseDto> {
    const spf = new ClientProductSPFDto();
    spf.limit = 11;

    const createdAtProp: keyof Product = 'createdAt';
    spf.sort = `-${createdAtProp}`;

    const [ adminListItems ] = await this.findEnabledProductListItems(spf, lang);
    const attributes = await this.attributeService.getAllAttributes();
    const clientListItems = await this.transformToClientListDto(adminListItems, attributes, lang);

    return {
      data: clientListItems
    };
  }

  async getClientProductListWithFilters(spf: ClientProductSPFDto, lang: Language): Promise<ClientProductListResponseDto> {
    // todo move logic to elastic
    // https://project-a.github.io/on-site-search-design-patterns-for-e-commerce/
    const [ adminListItems ] = await this.findEnabledProductListItems(spf, lang, { categoryId: spf.categoryId, query: spf.q, limit: 10000 });
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
      const filteredVariants: AdminProductVariantListItemDto[] = [];
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
    const clientListItems = await this.transformToClientListDto(filteredAdminListItems, attributes, lang);

    let filters = this.buildClientFilters(allSelectedAttributesProductCountMap, attributes, adminListItems.length, spfFilters, lang);
    if (itemsTotal > 0) {
      filters = this.addPriceFilter(filters, { possibleMinPrice, possibleMaxPrice, filterMinPrice, filterMaxPrice });
    }

    return {
      data: clientListItems,
      page: spf.page,
      pagesTotal: Math.ceil((itemsFiltered ?? itemsTotal) / spf.limit),
      itemsTotal,
      itemsFiltered,
      filters
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

  async getEnabledClientProductDtoBySlug(slug: string, lang: Language): Promise<ClientProductDto> {
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

    if (!found || !(found as ProductWithQty).isEnabled) {
      throw new NotFoundException(__('Product with slug "$1" not found', lang, slug));
    }

    return this.transformToClientProductDto(found, slug, lang);
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
          await this.updateProductPageRegistry(variant.slug, variantInDto.slug, variantInDto.createRedirect, session);
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

  async updateReviewRating(productId: number, session: ClientSession): Promise<any> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException(__('Product with id "$1" not found', 'ru', productId));
    }

    const { reviewsAvgRating, textReviewsCount, allReviewsCount } = await this.productReviewService.getRatingInfo(productId, session);
    product.reviewsAvgRating = reviewsAvgRating;
    product.textReviewsCount = textReviewsCount;
    product.allReviewsCount = allReviewsCount;

    await product.save({ session });
    await this.updateSearchDataById(productId, session);
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

    const populate = (treeItems: AdminCategoryTreeItemDto[], breadcrumbs: Breadcrumb[] = []) => {

      for (const treeItem of treeItems) {
        const newBreadcrumbs: Breadcrumb[] = JSON.parse(JSON.stringify(breadcrumbs));

        const foundIdx = product.categories.findIndex(category => category.id === treeItem.id);
        if (foundIdx !== -1) {
          product.categories[foundIdx].name = treeItem.name;
          product.categories[foundIdx].slug = treeItem.slug;

          newBreadcrumbs.push({ // todo remove this after converting breadcrumbs to ids only
            id: treeItem.id,
            name: treeItem.name,
            slug: treeItem.slug,
            isEnabled: treeItem.isEnabled
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
      categoryTreeItems = await this.categoryService.getCategoriesTree({ onlyEnabled: true });
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
    lang: Language,
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
      const nameProp: keyof AdminProductVariantListItemDto = 'name';
      const skuProp: keyof AdminProductVariantListItemDto = 'sku';
      const vendorCodeProp: keyof AdminProductVariantListItemDto = 'vendorCode';

      const namePropPath = `${variantsProp}.${nameProp}.${lang}`;
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
      new ElasticProduct(),
      true
    );
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
          salesCount: variant.salesCount
        });
      }

      return {
        id: product._id,
        categories: product.categories,
        name: product.name,
        attributes: product.attributes,
        isEnabled: product.isEnabled,
        skus: product.variants[0].sku,
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
        salesCount,
        variants
      };
    });
  }

  private async transformToClientListDto(
    adminListItemDtos: AdminProductListItemDto[],
    attributes: Attribute[],
    lang: Language
  ): Promise<ClientProductListItemDto[]> {

    return adminListItemDtos.map(product => {
      let selectedVariantIdx = 0; // todo add flag in ProductVariant to select here default variant?
      let selectedVariant = product.variants[selectedVariantIdx];
      if (selectedVariant.sellableQty <= 0) {
        const variantInStockIdx = product.variants.findIndex(variantArg => variantArg.sellableQty > 0);
        if (variantInStockIdx > -1) {
          selectedVariantIdx = variantInStockIdx;
          selectedVariant = product.variants[selectedVariantIdx];
        }
      }

      let variantGroups: ClientProductVariantGroupDto[] = [];
      if (product.variants.length > 1) {
        for (const productSelectedAttribute of selectedVariant.attributes) {
          const attribute = attributes.find(a => a.id === productSelectedAttribute.attributeId);
          if (!attribute || attribute.type === AttributeTypeEnum.MultiSelect) { continue; }

          const attrValue = attribute.values.find(v => productSelectedAttribute.valueIds.includes(v.id));
          if (!attrValue) { continue; }

          const itemVariant: ClientProductVariantDto = {
            label: attrValue.label[lang],
            isSelected: true,
            slug: selectedVariant.slug,
            isInStock: selectedVariant.sellableQty > 0,
            color: attrValue.color
          };

          variantGroups.push({
            attribute: attribute,
            attributeValueId: attrValue.id,
            label: attribute.label[lang],
            hasColor: attribute.hasColor,
            variants: [ itemVariant ],
            selectedVariantLabel: itemVariant.label
          });
        }

        for (let i = 0; i < variantGroups.length; i++) {
          const restGroups = variantGroups.filter((_, index) => index !== i);

          for (let k = 0; k < product.variants.length; k++) {
            if (k === selectedVariantIdx) { continue; }

            const productVariant = product.variants[k];
            const isMatched = restGroups.every(group =>
              productVariant.attributes.find(attr => attr.attributeId === group.attribute.id && attr.valueIds.includes(group.attributeValueId))
            );
            if (!isMatched) { continue; }

            if (!productVariant.isEnabled) { continue; }

            const isInStock = productVariant.sellableQty > 0;
            if (!isInStock) { continue; }

            const selectedAttribute = productVariant.attributes.find(attr => attr.attributeId === variantGroups[i].attribute.id);
            const attributeValue = variantGroups[i].attribute.values.find(value => selectedAttribute.valueIds.includes(value.id));
            variantGroups[i].variants.push({
              label: attributeValue.label[lang],
              color: attributeValue.color,
              isSelected: false,
              slug: productVariant.slug,
              isInStock
            });
          }

          variantGroups[i].variants = sortByLabel(variantGroups[i].variants);
        }

        variantGroups = variantGroups.filter(group => group.variants.length > 1);
        variantGroups = plainToClass(ClientProductVariantGroupDto, variantGroups, { excludeExtraneousValues: true });
      }

      return {
        id: createClientProductId(product.id, selectedVariant.id.toString()),
        productId: product.id,
        variantId: selectedVariant.id,
        sku: selectedVariant.sku,
        isInStock: selectedVariant.sellableQty > 0,
        name: selectedVariant.name[lang],
        price: selectedVariant.priceInDefaultCurrency,
        oldPrice: selectedVariant.oldPriceInDefaultCurrency,
        slug: selectedVariant.slug,
        variantGroups,
        mediaUrl: selectedVariant.mediaUrl,
        mediaHoverUrl: selectedVariant.mediaHoverUrl,
        mediaAltText: selectedVariant.mediaAltText?.[lang],
        allReviewsCount: product.allReviewsCount,
        textReviewsCount: product.textReviewsCount,
        reviewsAvgRating: product.reviewsAvgRating
      }
    });
  }

  async transformToClientProductDto(productWithQty: ProductWithQty, slug: string, lang: Language): Promise<ClientProductDto> {
    const selectedVariantIdx = productWithQty.variants.findIndex(v => v.slug === slug);
    const selectedVariant = productWithQty.variants[selectedVariantIdx];

    const categories: ClientProductCategoryDto[] = productWithQty.categories
      .filter(category => category.isEnabled)
      .map(category => ClientProductCategoryDto.transformToDto(category, lang));

    const attributeModels = await this.attributeService.getAllAttributes();

    const characteristics: ClientProductCharacteristic[] = [];
    for (const attribute of productWithQty.attributes) {
      const foundAttr = attributeModels.find(a => a.id === attribute.attributeId);
      if (!foundAttr || !foundAttr.isVisibleInProduct) { continue; }

      const foundAttrValues = foundAttr.values.filter(v => attribute.valueIds.includes(v.id));
      if (!foundAttrValues.length) { continue; }

      const value = foundAttrValues.map(value => value.label[lang]).join(', ');
      characteristics.push({ label: foundAttr.label[lang], code: foundAttr._id, value });
    }

    let variantGroups: ClientProductVariantGroupDto[] = [];
    if (productWithQty.variants.length > 1) {
      for (const productSelectedAttribute of selectedVariant.attributes) {
        const attribute = attributeModels.find(a => a.id === productSelectedAttribute.attributeId);
        if (!attribute || attribute.type === AttributeTypeEnum.MultiSelect) { continue; }

        const attrValue = attribute.values.find(v => productSelectedAttribute.valueIds.includes(v.id));
        if (!attrValue) { continue; }

        const itemVariant: ClientProductVariantDto = {
          label: attrValue.label[lang],
          color: attrValue.color,
          isSelected: true,
          slug: selectedVariant.slug,
          isInStock: selectedVariant.qtyInStock > selectedVariant.reserved.reduce((sum, ordered) => sum + ordered.qty, 0)
        };

        variantGroups.push({
          attribute: attribute,
          attributeValueId: attrValue.id,
          label: attribute.label[lang],
          hasColor: attribute.hasColor,
          variants: [ itemVariant ],
          selectedVariantLabel: itemVariant.label
        });

        characteristics.push({ label: attribute.label[lang], code: attribute.id, value: attrValue.label[lang] });
      }

      for (let i = 0; i < variantGroups.length; i++) {
        const restGroups = variantGroups.filter((_, index) => index !== i);

        for (let k = 0; k < productWithQty.variants.length; k++) {
          if (k === selectedVariantIdx) { continue; }

          const productVariant = productWithQty.variants[k];
          const isMatched = restGroups.every(group =>
            productVariant.attributes.find(attr => attr.attributeId === group.attribute.id && attr.valueIds.includes(group.attributeValueId))
          );
          if (!isMatched || !productVariant.isEnabled) { continue; }

          const selectedAttribute = productVariant.attributes.find(attr => attr.attributeId === variantGroups[i].attribute.id);
          const attributeValue = variantGroups[i].attribute.values.find(value => selectedAttribute.valueIds.includes(value.id));
          variantGroups[i].variants.push({
            label: attributeValue.label[lang],
            color: attributeValue.color,
            isSelected: false,
            slug: productVariant.slug,
            isInStock: productVariant.qtyInStock > productVariant.reserved.reduce((sum, ordered) => sum + ordered.qty, 0)
          });
        }

        variantGroups[i].variants = sortByLabel(variantGroups[i].variants);
      }

      variantGroups = plainToClass(ClientProductVariantGroupDto, variantGroups, { excludeExtraneousValues: true });
    }

    return {
      id: createClientProductId(productWithQty._id, selectedVariant._id.toString()),
      productId: productWithQty._id,
      variantId: selectedVariant._id.toString(),
      isInStock: selectedVariant.qtyInStock > selectedVariant.reserved.reduce((sum, ordered) => sum + ordered.qty, 0),
      categories,
      variantGroups,
      characteristics,
      breadcrumbs: productWithQty.breadcrumbs.map(breadcrumb => ClientBreadcrumbDto.transformTodo(breadcrumb, lang)),
      fullDescription: selectedVariant.fullDescription[lang],
      shortDescription: selectedVariant.shortDescription[lang],
      medias: ClientMediaDto.transformToDtosArray(selectedVariant.medias, lang),
      metaTags: ClientMetaTagsDto.transformToDto(selectedVariant.metaTags, lang),
      name: selectedVariant.name[lang],
      slug: selectedVariant.slug,
      sku: selectedVariant.sku,
      vendorCode: selectedVariant.vendorCode,
      gtin: selectedVariant.gtin,
      price: selectedVariant.priceInDefaultCurrency,
      oldPrice: selectedVariant.oldPriceInDefaultCurrency,
      isDiscountApplicable: selectedVariant.isDiscountApplicable,
      reviewsAvgRating: productWithQty.reviewsAvgRating,
      allReviewsCount: productWithQty.allReviewsCount,
      textReviewsCount: productWithQty.textReviewsCount,
      relatedProducts: selectedVariant.relatedProducts
        .sort(((a, b) => b.sortOrder - a.sortOrder))
        .map(p => ({ productId: p.productId, variantId: p.variantId.toString() })),
      additionalServiceIds: productWithQty.additionalServiceIds
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

  private async setProductPrices(product: DocumentType<Product>): Promise<DocumentType<Product>> {
    const exchangeRate = await this.currencyService.getExchangeRate(product.variants[0].currency);

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

  private areProductCategoriesEqual(categories1: ProductCategory[], categories2: AdminProductCategoryDto[]): boolean {
    return areArraysEqual(categories1.map(c => c.id), categories2.map(c => c.id));
  }

  @CronProdPrimaryInstance(getCronExpressionEarlyMorning())
  async updateProductsOrder({ categoryId, fixedProductId }: { categoryId: number, fixedProductId: number } = { categoryId: null, fixedProductId: null }) {
    let categories: Category[];
    if (categoryId) {
      categories = [await this.categoryService.getCategoryById(categoryId)];
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

  async lockProductSortOrder(reorderDto: ProductReorderDto) {
    const session = await this.productModel.db.startSession();
    session.startTransaction();

    try {
      const product = await this.productModel.findById(reorderDto.id).session(session).exec();
      if (!product) {
        throw new BadRequestException(__('Product with id "$1" not found', 'ru', reorderDto.id));
      }

      const productCategoryIdx = product.categories.findIndex(c => c.id === reorderDto.categoryId);
      if (productCategoryIdx === -1) {
        throw new BadRequestException(__('Product with id "$1" is not present in category with id "$2"', 'ru', reorderDto.id, reorderDto.categoryId));
      }

      const targetProduct = await this.productModel.findById(reorderDto.targetId);
      if (!targetProduct) {
        throw new BadRequestException(__('Product with id "$1" not found', 'ru', reorderDto.targetId));
      }

      const targetProductCategory = targetProduct.categories.find(c => c.id === reorderDto.categoryId);
      if (!targetProductCategory) {
        throw new BadRequestException(__('Product with id "$1" is not present in category with id "$2"', 'ru', reorderDto.targetId, reorderDto.categoryId));
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
      await this.updateSearchDataById(reorderDto.id, session);
      await session.commitTransaction();

      await this.updateProductsOrder({ categoryId: reorderDto.categoryId, fixedProductId: reorderDto.id });

    } catch (ex) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw ex;
    } finally {
      await session.endSession();
    }
  }

  async unlockProductSortOrder(unfixDto: UnfixProductOrderDto) {
    const session = await this.productModel.db.startSession();
    session.startTransaction();

    try {
      const product = await this.productModel.findById(unfixDto.id).session(session).exec();
      if (!product) {
        throw new BadRequestException(__('Product with id "$1" not found', 'ru', unfixDto.id));
      }

      const productCategoryIdx = product.categories.findIndex(c => c.id === unfixDto.categoryId);
      if (productCategoryIdx === -1) {
        throw new BadRequestException(__('Product with id "$1" is not present in category with id "$2"', 'ru', unfixDto.id, unfixDto.categoryId));
      }

      if (!product.categories[productCategoryIdx].isSortOrderFixed) {
        throw new BadRequestException(__('Product with id "$1" does not have fixed sort order in category with id "$2"', 'ru', unfixDto.id, unfixDto.categoryId));
      }

      product.categories[productCategoryIdx].reversedSortOrder = product.categories[productCategoryIdx].reversedSortOrderBeforeFix;
      product.categories[productCategoryIdx].reversedSortOrderBeforeFix = 0;
      product.categories[productCategoryIdx].isSortOrderFixed = false;
      await product.save({ session });
      await this.updateSearchDataById(unfixDto.id, session);
      await session.commitTransaction();

      await this.updateProductsOrder({ categoryId: unfixDto.categoryId, fixedProductId: null });

    } catch (ex) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw ex;
    } finally {
      await session.endSession();
    }
  }

  async reorderProductDeprecated(reorderDto: ProductReorderDto) {
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

  private buildClientFilters(
    attributeProductCountMap: AttributeProductCountMap,
    attributes: Attribute[],
    totalFound: number,
    spfFilters: IFilter[],
    lang: Language
  ): ClientFilterDto[] {

    const clientFilters: ClientFilterDto[] = [];

    Object.keys(attributeProductCountMap).forEach(attributeId => {
      const { valuesMap, productCountForAttr } = attributeProductCountMap[attributeId];
      if ((productCountForAttr / totalFound) < (this.filtersThresholdPercent / 100)) { return; }

      const attribute = attributes.find(attribute => attribute.id === attributeId);
      if (!attribute || !attribute.isVisibleInFilters) { return; }

      const spfFilter = spfFilters.find(spfFilter => spfFilter.fieldName === attributeId);

      let values: ClientFilterValueDto[] = [];
      let valuesProductsCount = 0;
      Object.entries(valuesMap).forEach(([ valueId, productsCount ]) => {
        const attributeValue = attribute.values.find(value => value.id === valueId);
        if (!attributeValue) { return; }

        let isSelected = false;
        if (spfFilter) {
          isSelected = spfFilter.values.includes(valueId);
        }

        valuesProductsCount += productsCount;

        values.push({
          id: attributeValue.id,
          label: attributeValue.label[lang],
          isDisabled: productsCount === 0,
          productsCount,
          isSelected
        });
      });

      if (values.length <= 1) { return; }

      values = sortByLabel(values);

      clientFilters.push({
        id: attribute.id,
        label: attribute.label[lang],
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

  async buildAdminFilters(spf: AdminSPFDto): Promise<IFilter[]> {
    if (!spf.hasFilters()) { return []; }

    const variantsProp = getPropertyOf<AdminProductListItemDto>('variants');
    const attributesProp = getPropertyOf<AdminProductListItemDto>('attributes');
    const attributeIdProp = getPropertyOf<AdminProductSelectedAttributeDto>('attributeId');
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
        fieldName: `${attributesProp}.${attributeIdProp}|${variantsProp}.${attributesProp}.${attributeIdProp}`,
        values: [attribute.id]
      });
      filters.push({
        fieldName: `${attributesProp}.${valueIdsProp}|${variantsProp}.${attributesProp}.${valueIdsProp}`,
        values: filter.values
      });
    }

    return filters;
  }

  async incrementViewsCount(productId: number): Promise<void> {
    try {
      await this.productModel.findByIdAndUpdate(productId, { $inc: { viewsCount: 1 } });
    } catch (e) {
      this.logger.error(`Could not update views count:`);
      this.logger.error(e);
    }
  }

  private async googleTranslate() {
    // this.logger.log('start fetch');
    // const products = await this.productModel.find().exec();
    // this.logger.log('end fetch');
    // const sLogs = [];
    // const fLogs = [];
    // for (const product of products) {
    //   const name = product.name.ru;
    //   const description = product.variants[0].fullDescription.ru;
    //   const mTitle = product.variants[0].metaTags.title.ru;
    //   const mDescription = product.variants[0].metaTags.description.ru;
    //   const gTitle = product.variants[0].googleAdsProductTitle.ru;
    //   try {
    //     let [translatedName, translatedDesc, transMTitle, transMDescription, transGTitle] = await googleTranslate([name, description, mTitle, mDescription, gTitle]);
    //     translatedName = translatedName.replace(/сусалам/g, 'сусаль').replace(/Сусалам/g, 'Сусаль');
    //     translatedDesc = translatedDesc.replace(/сусалам/g, 'сусаль').replace(/Сусалам/g, 'Сусаль');
    //     transMTitle = transMTitle.replace(/сусалам/g, 'сусаль').replace(/Сусалам/g, 'Сусаль');
    //     transMDescription = transMDescription.replace(/сусалам/g, 'сусаль').replace(/Сусалам/g, 'Сусаль');
    //     if (transGTitle) {
    //       transGTitle = transGTitle.replace(/сусалам/g, 'сусаль').replace(/Сусалам/g, 'Сусаль');
    //     }
    //
    //     product.name.uk = translatedName;
    //     product.variants[0].name.uk = translatedName;
    //     product.variants[0].fullDescription.uk = translatedDesc;
    //     product.variants[0].metaTags.title.uk = transMTitle;
    //     product.variants[0].metaTags.description.uk = transMDescription;
    //     if (transGTitle) {
    //       product.variants[0].googleAdsProductTitle.uk = transGTitle;
    //     }
    //
    //     for (const media of product.variants[0].medias) {
    //       media.altText.uk = translatedName;
    //     }
    //
    //     await product.save();
    //     console.log(product.id);
    //     sLogs.push(product.id);
    //   } catch (e) {
    //     console.log(e);
    //     console.error('error '+ product.id);
    //     fLogs.push(product.id);
    //   }
    // }
    //
    // this.logger.log('success');
    // this.logger.log(sLogs);
    // this.logger.log('error');
    // this.logger.log(fLogs);
  }
}
