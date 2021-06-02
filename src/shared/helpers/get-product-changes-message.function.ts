import { Product } from '../../product/models/product.model';
import { AdminAddOrUpdateProductDto } from '../dtos/admin/product.dto';
import { areMultilingualTextsEqual } from './are-multilingual-texts-equal.function';
import { areArraysEqual } from './are-arrays-equal.function';
import { ProductVariant } from '../../product/models/product-variant.model';
import { AdminAddOrUpdateProductVariantDto } from '../dtos/admin/product-variant.dto';

export const getProductChangesMessage = (product: Product, productDto: AdminAddOrUpdateProductDto): string => {
  const messages: string[] = [];

  if (product.isEnabled !== productDto.isEnabled) {
    messages.push(`prevIsEnabled=${product.isEnabled}, newIsEnabled=${productDto.isEnabled}`);
  }
  if (!areMultilingualTextsEqual(product.name, productDto.name)) {
    messages.push(`name`);
  }

  const productCategoriesIds = product.categories.map(c => c.id);
  const dtoCategoriesIds = productDto.categories.map(c => c.id);
  const addedCategoriesIds = dtoCategoriesIds.filter(categoryId => !productCategoriesIds.includes(categoryId));
  const deletedCategoriesIds = productCategoriesIds.filter(categoryId => !dtoCategoriesIds.includes(categoryId));
  if (addedCategoriesIds.length) {
    messages.push(`addedCategoriesIds=[${addedCategoriesIds}]`);
  }
  if (deletedCategoriesIds.length) {
    messages.push(`deletedCategoriesIds=[${deletedCategoriesIds}]`);
  }

  const prevBreadcrumbsVariant = product.breadcrumbsVariants.find(breadcrumbsVariant => breadcrumbsVariant.isActive);
  const newBreadcrumbsVariant = productDto.breadcrumbsVariants.find(breadcrumbsVariant => breadcrumbsVariant.isActive);
  if (!areArraysEqual(prevBreadcrumbsVariant.categoryIds, newBreadcrumbsVariant.categoryIds)) {
    messages.push(`prevBreadcrumbs=[${prevBreadcrumbsVariant.categoryIds}], newBreadcrumbs=[${newBreadcrumbsVariant.categoryIds}]`);
  }

  if (product.note !== productDto.note) {
    messages.push(`prevNote=${product.note}, newNote=${productDto.note}`);
  }

  if (!areArraysEqual(product.additionalServiceIds, productDto.additionalServiceIds)) {
    messages.push(`prevServiceIds=${product.additionalServiceIds}, newServiceIds=${productDto.additionalServiceIds}`);
  }

  const addedProductAttributes = productDto.attributes.filter(dtoAttr => {
    return product.attributes.findIndex(productAttr => productAttr.attributeId === dtoAttr.attributeId && areArraysEqual(productAttr.valueIds, dtoAttr.valueIds)) === -1;
  });
  const deletedProductAttributes = product.attributes.filter(productAttr => {
    return productDto.attributes.findIndex(dtoAttr => dtoAttr.attributeId === productAttr.attributeId && areArraysEqual(dtoAttr.valueIds, productAttr.valueIds)) === -1;
  });
  if (addedProductAttributes.length) {
    messages.push(`addedProductAttributes=[${addedProductAttributes.map(attr => `${attr.attributeId}:${attr.valueIds}`)}]`);
  }
  if (deletedProductAttributes.length) {
    messages.push(`deletedProductAttributes=[${deletedProductAttributes.map(attr => `${attr.attributeId}:${attr.valueIds}`)}]`);
  }

  const deletedVariants = product.variants.filter(productVariant => {
    return productDto.variants.findIndex(dtoVariant => productVariant.sku === dtoVariant.sku) === -1;
  });
  const addedDtoVariants: AdminAddOrUpdateProductVariantDto[] = [];
  const updatedVariants: { productVariant: ProductVariant, dtoVariant: AdminAddOrUpdateProductVariantDto }[] = [];
  productDto.variants.forEach(dtoVariant => {
    const productVariant = product.variants.find(prodVariant => prodVariant.sku === dtoVariant.sku);
    if (productVariant) {
      updatedVariants.push({
        productVariant,
        dtoVariant
      });
    } else {
      addedDtoVariants.push(dtoVariant);
    }
  });

  if (deletedVariants.length) {
    messages.push(`deletedVariants=[${deletedVariants.map(v => v.sku)}]`);
  }
  if (addedDtoVariants.length) {
    messages.push(`addedVariants=[${addedDtoVariants.map(v => v.sku)}]`);
  }

  for (const { productVariant, dtoVariant } of updatedVariants) {
    const sku = productVariant.sku;

    if (!areMultilingualTextsEqual(productVariant.name, dtoVariant.name)) {
      messages.push(`${sku}_name`);
    }
    if (productVariant.slug !== dtoVariant.slug) {
      messages.push(`${sku}_prevSlug=${productVariant.slug}, ${sku}_newSlug=${dtoVariant.slug}`);
    }
    if (productVariant.isEnabled !== dtoVariant.isEnabled) {
      messages.push(`${sku}_prevIsEnabled=${productVariant.isEnabled}, ${sku}_newIsEnabled=${dtoVariant.isEnabled}`);
    }
    if (productVariant.price !== dtoVariant.price) {
      messages.push(`${sku}_prevPrice=${productVariant.price}, ${sku}_newPrice=${dtoVariant.price}`);
    }
    if (productVariant.oldPrice !== dtoVariant.oldPrice) {
      messages.push(`${sku}_prevOldPrice=${productVariant.oldPrice}, ${sku}_newOldPrice=${dtoVariant.oldPrice}`);
    }
    if (productVariant.vendorCode !== dtoVariant.vendorCode) {
      messages.push(`${sku}_prevVendorCode=${productVariant.vendorCode}, ${sku}_newVendorCode=${dtoVariant.vendorCode}`);
    }
    if (productVariant.gtin !== dtoVariant.gtin) {
      messages.push(`${sku}_prevGtin=${productVariant.gtin}, ${sku}_newGtin=${dtoVariant.gtin}`);
    }
    if (productVariant.isIncludedInShoppingFeed !== dtoVariant.isIncludedInShoppingFeed) {
      messages.push(`${sku}_prevIsInFeed=${productVariant.isIncludedInShoppingFeed}, ${sku}_newIsInFeed=${dtoVariant.isIncludedInShoppingFeed}`);
    }
    if (productVariant.isDiscountApplicable !== dtoVariant.isDiscountApplicable) {
      messages.push(`${sku}_prevIsDiscountsApplicable=${productVariant.isDiscountApplicable}, ${sku}_newIsDiscountsApplicable=${dtoVariant.isDiscountApplicable}`);
    }
    if (!areMultilingualTextsEqual(productVariant.googleAdsProductTitle, dtoVariant.googleAdsProductTitle)) {
      messages.push(`${sku}_googleAdsProductTitle`);
    }
    if (!areMultilingualTextsEqual(productVariant.fullDescription, dtoVariant.fullDescription)) {
      messages.push(`${sku}_fullDescription`);
    }
    if (!areMultilingualTextsEqual(productVariant.shortDescription, dtoVariant.shortDescription)) {
      messages.push(`${sku}_shortDescription`);
    }
    if (!areMultilingualTextsEqual(productVariant.metaTags.title, dtoVariant.metaTags.title)) {
      messages.push(`${sku}_MetaTitle`);
    }
    if (!areMultilingualTextsEqual(productVariant.metaTags.description, dtoVariant.metaTags.description)) {
      messages.push(`${sku}_MetaDescription`);
    }
    if (!areMultilingualTextsEqual(productVariant.metaTags.keywords, dtoVariant.metaTags.keywords)) {
      messages.push(`${sku}_MetaKeywords`);
    }

    const addedVariantAttributes = dtoVariant.attributes.filter(dtoAttr => {
      return productVariant.attributes.findIndex(productAttr => productAttr.attributeId === dtoAttr.attributeId && areArraysEqual(productAttr.valueIds, dtoAttr.valueIds)) === -1;
    });
    const deletedVariantAttributes = productVariant.attributes.filter(productAttr => {
      return dtoVariant.attributes.findIndex(dtoAttr => dtoAttr.attributeId === productAttr.attributeId && areArraysEqual(dtoAttr.valueIds, productAttr.valueIds)) === -1;
    });
    if (addedVariantAttributes.length) {
      messages.push(`${sku}_addedAttributes=[${addedVariantAttributes.map(attr => `${attr.attributeId}:${attr.valueIds}`)}]`);
    }
    if (deletedVariantAttributes.length) {
      messages.push(`${sku}_deletedAttributes=[${deletedVariantAttributes.map(attr => `${attr.attributeId}:${attr.valueIds}`)}]`);
    }

    const productRelatedIds = productVariant.relatedProducts.map(p => `${p.productId}-${p.variantId}`);
    const dtoRelatedIds = dtoVariant.relatedProducts.map(p => `${p.productId}-${p.variantId}`);
    const addedRelatedIds = dtoRelatedIds.filter(categoryId => !productRelatedIds.includes(categoryId));
    const deletedRelatedIds = productRelatedIds.filter(categoryId => !dtoRelatedIds.includes(categoryId));
    if (addedRelatedIds.length) {
      messages.push(`${sku}_addedRelatedIds=[${addedRelatedIds}]`);
    }
    if (deletedRelatedIds.length) {
      messages.push(`${sku}_deletedRelatedIds=[${deletedRelatedIds}]`);
    }

    const productCrossIds = productVariant.crossSellProducts.map(p => `${p.productId}-${p.variantId}`);
    const dtoCrossIds = dtoVariant.crossSellProducts.map(p => `${p.productId}-${p.variantId}`);
    const addedCrossIds = dtoCrossIds.filter(categoryId => !productCrossIds.includes(categoryId));
    const deletedCrossIds = productCrossIds.filter(categoryId => !dtoCrossIds.includes(categoryId));
    if (addedCrossIds.length) {
      messages.push(`${sku}_addedCrossIds=[${addedCrossIds}]`);
    }
    if (deletedCrossIds.length) {
      messages.push(`${sku}_deletedCrossIds=[${deletedCrossIds}]`);
    }

    if (productVariant.medias.length !== dtoVariant.medias.length) {
      messages.push(`${sku}_prevMediasCount=${productVariant.medias.length}, ${sku}_newMediasCount=${dtoVariant.medias.length}`);
    }
  }

  return messages.join(', ');
}
