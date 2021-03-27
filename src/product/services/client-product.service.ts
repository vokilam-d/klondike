import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { Product } from '../models/product.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from '@nestjs/mongoose';
import { Inventory } from '../../inventory/models/inventory.model';
import { getPropertyOf } from '../../shared/helpers/get-property-of.function';
import { ClientSession } from 'mongoose';
import { ProductVariant } from '../models/product-variant.model';
import { SearchService } from '../../shared/services/search/search.service';
import { AdminProductListItemDto } from '../../shared/dtos/admin/product-list-item.dto';
import { ProductWithQty } from '../models/product-with-qty.model';
import { AdminProductVariantListItemDto } from '../../shared/dtos/admin/product-variant-list-item.dto';
import { ElasticProduct } from '../models/elastic-product.model';
import { IFilter, SortingPaginatingFilterDto } from '../../shared/dtos/shared-dtos/spf.dto';
import { ClientProductListItemDto, ClientProductVariantDto, ClientProductVariantGroupDto } from '../../shared/dtos/client/product-list-item.dto';
import { AttributeService } from '../../attribute/attribute.service';
import { ClientProductCategoryDto, ClientProductCharacteristic, ClientProductDto } from '../../shared/dtos/client/product.dto';
import { plainToClass } from 'class-transformer';
import { ClientMediaDto } from '../../shared/dtos/client/media.dto';
import { ClientProductSPFDto } from '../../shared/dtos/client/product-spf.dto';
import { AdminProductCategoryDto } from '../../shared/dtos/admin/product-category.dto';
import { __ } from '../../shared/helpers/translate/translate.function';
import { AttributeTypeEnum } from '../../shared/enums/attribute-type.enum';
import { ClientProductListResponseDto } from '../../shared/dtos/client/product-list-response.dto';
import { ClientFilterDto, ClientFilterValueDto } from '../../shared/dtos/client/filter.dto';
import { Attribute } from '../../attribute/models/attribute.model';
import { isNumber } from '../../shared/helpers/is-number.function';
import { AdminProductSelectedAttributeDto } from '../../shared/dtos/admin/product-selected-attribute.dto';
import { CronExpression } from '@nestjs/schedule';
import { createClientProductId } from '../../shared/helpers/client-product-id';
import { sortByLabel } from '../../shared/helpers/sort-by-label.function';
import { ClientMetaTagsDto } from '../../shared/dtos/client/meta-tags.dto';
import { Language } from '../../shared/enums/language.enum';
import { ClientBreadcrumbDto } from '../../shared/dtos/client/breadcrumb.dto';
import { Dictionary } from '../../shared/helpers/dictionary';
import { EventsService } from '../../shared/services/events/events.service';
import { ProductLabelTypeEnum } from '../../shared/enums/product-label-type.enum';
import { CronProd } from '../../shared/decorators/prod-cron.decorator';
import { AdminProductService } from './admin-product.service';

interface AttributeProductCountMap {
  [attributeId: string]: {
    valuesMap: { [valueId: string]: number; };
    productCountForAttr: number;
  };
}

@Injectable()
export class ClientProductService implements OnApplicationBootstrap {

  private logger = new Logger(ClientProductService.name);

  private filtersThresholdPercent = 25;

  private cachedProductCount: number;
  private clientProductListCache: Dictionary<ClientProductListResponseDto> = new Dictionary();
  private cachedClientProduct: Dictionary<ClientProductDto> = new Dictionary();

  constructor(
    @InjectModel(Product.name) private readonly productModel: ReturnModelType<typeof Product>,
    private readonly attributeService: AttributeService,
    private readonly searchService: SearchService,
    private readonly eventsService: EventsService
  ) { }

  async onApplicationBootstrap() {
    this.handleProductCache();
  }

  async getClientProductList(spf: ClientProductSPFDto, lang: Language): Promise<ClientProductListResponseDto> {
    const isEnabledProp: keyof AdminProductListItemDto = 'isEnabled';

    spf[isEnabledProp] = true;

    const normalizedFilters = spf.getNormalizedFilters();
    const filters: IFilter[] = await this.getValidAttributeFilters(normalizedFilters);
    filters.push(...this.getValidNonAttributeFilters(normalizedFilters));

    const [adminDtos, itemsTotal] = await this.findByFilters(spf, filters);
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
    const attributes = await this.attributeService.getAllAttributes();
    const normalizedFilters = spf.getNormalizedFilters();
    const spfFilters = await this.getValidAttributeFilters(normalizedFilters, attributes);
    spfFilters.push(...this.getValidNonAttributeFilters(normalizedFilters));

    const cacheKey = {
      spfFilters,
      categoryId: spf.categoryId,
      query: spf.q,
      page: spf.page,
      limit: spf.limit,
      price: spf.price,
      skip: spf.skip,
      sortFilter: spf.sortFilter,
      sort: spf.getSortAsObj(),
      lang
    };
    const cache = this.clientProductListCache.get(cacheKey);
    if (cache) {
      return cache;
    }

    // todo move logic to elastic
    // https://project-a.github.io/on-site-search-design-patterns-for-e-commerce/
    const [ adminListItems ] = await this.findEnabledProductListItems(spf, lang, { categoryId: spf.categoryId, query: spf.q, limit: 10000 });

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

    let possibleMinPrice = adminListItems?.[0]?.variants[0].priceInDefaultCurrency || 0;
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
          if (variant.priceInDefaultCurrency < filterMinPrice) {
            isPassedByPrice = false;
          }
          if (filterMaxPrice && variant.priceInDefaultCurrency > filterMaxPrice) {
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

        if (variant.priceInDefaultCurrency < possibleMinPrice) { possibleMinPrice = variant.priceInDefaultCurrency; }
        if (variant.priceInDefaultCurrency > possibleMaxPrice) { possibleMaxPrice = variant.priceInDefaultCurrency; }
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

    const responseDto: ClientProductListResponseDto = {
      data: clientListItems,
      page: spf.page,
      pagesTotal: Math.ceil((itemsFiltered ?? itemsTotal) / spf.limit),
      itemsTotal,
      itemsFiltered,
      filters
    };
    this.clientProductListCache.set(cacheKey, responseDto);

    return responseDto;
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

  async getEnabledClientProductDtoBySlug(slug: string, lang: Language): Promise<ClientProductDto> {
    const cacheKey = { slug, lang };
    const cache = this.cachedClientProduct.get(cacheKey);
    if (cache) {
      return cache;
    }

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

    const dto = await this.transformToClientProductDto(found, slug, lang);
    this.cachedClientProduct.set(cacheKey, dto);

    return dto;
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
        label: {
          type: selectedVariant.label === ProductLabelTypeEnum.Empty ? null : selectedVariant.label,
          text: selectedVariant.label === ProductLabelTypeEnum.Empty ? null : __(selectedVariant.label, lang)
        },
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
      label: {
        type: selectedVariant.label === ProductLabelTypeEnum.Empty ? null : selectedVariant.label,
        text: selectedVariant.label === ProductLabelTypeEnum.Empty ? null : __(selectedVariant.label, lang)
      },
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

  async incrementViewsCount(productId: number): Promise<void> {
    try {
      await this.productModel.findByIdAndUpdate(productId, { $inc: { viewsCount: 1 } });
    } catch (e) {
      this.logger.error(`Could not update views count:`);
      this.logger.error(e);
    }
  }

  private handleProductCache() {
    this.updateCachedProductCount();

    this.eventsService.on(AdminProductService.productUpdatedEventName, () => {
      this.updateCachedProductCount();
      this.clientProductListCache.clear();
      this.cachedClientProduct.clear();
    });
  }

  @CronProd(CronExpression.EVERY_HOUR)
  private updateCachedProductCount() {
    this.productModel.estimatedDocumentCount().exec()
      .then(count => this.cachedProductCount = count)
      .catch(_ => { });
  }

  private async getValidAttributeFilters(filters: IFilter[], attributes?: Attribute[]): Promise<IFilter[]> {
    if (!attributes) {
      attributes = await this.attributeService.getAllAttributes();
    }

    return filters.filter(spfFilter => !!attributes.find(attribute => attribute.id === spfFilter.fieldName));
  }

  private getValidNonAttributeFilters(filters: IFilter[]): IFilter[] {
    return filters.filter(spfFilter => spfFilter.fieldName === 'id');
  }
}
