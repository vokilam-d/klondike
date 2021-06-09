import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AdminProductService } from '../product/services/admin-product.service';
import { AdminSPFDto } from '../shared/dtos/admin/spf.dto';
import { stripHtmlTags } from '../shared/helpers/strip-html-tags.function';
import { ProductReviewService } from '../reviews/product-review/product-review.service';
import { AdminProductReviewDto } from '../shared/dtos/admin/product-review.dto';
import { ProductVariantWithQty, ProductWithQty } from '../product/models/product-with-qty.model';
import { AttributeService } from '../attribute/attribute.service';
import { ProductSelectedAttribute } from '../product/models/product-selected-attribute.model';
import { priceThresholdForFreeShipping } from '../shared/constants';
import { MultilingualText } from '../shared/models/multilingual-text.model';
import { Language } from '../shared/enums/language.enum';
import { XmlBuilder } from '../shared/services/xml-builder/xml-builder.service';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { CategoryService } from '../category/category.service';
import { BreadcrumbsVariant } from '../shared/models/breadcrumbs-variant.model';
import { MediaVariantEnum } from '../shared/enums/media-variant.enum';

type cdata = { $: string };

interface IShoppingFeedItem {
  'g:id': cdata;
  'g:title': cdata;
  'g:link': cdata;
  'g:price'?: cdata;
  'g:sale_price'?: cdata;
  'g:description': cdata;
  'g:product_type'?: cdata;
  'g:image_link'?: cdata;
  'g:additional_image_link'?: cdata;
  'g:condition'?: string;
  'g:identifier_exists'?: string;
  'g:availability'?: string;
  'g:custom_label_0'?: string;
  'g:brand': cdata;
  'g:mpn'?: cdata;
  'g:gtin'?: cdata;
  'g:override'?: cdata;
}

interface IShoppingReviewProduct {
  'product_ids': {
    'mpns': {
      'mpn': cdata;
    };
    'skus': {
      'sku': cdata;
    }
  };
  'product_name': cdata;
  'product_url': cdata;
}

interface IShoppingReview {
  'review_id': number;
  'reviewer': {
    'name': cdata;
  };
  'review_timestamp': string;
  'content': cdata;
  'review_url': {
    '@type': 'singleton',
    '$': string;
  };
  'ratings': {
    'overall': {
      '@': {
        min: 1;
        max: 5;
      },
      '#': number;
    };
  };
  'products': {
    'product': IShoppingReviewProduct
  }
}

@Injectable()
export class ShoppingFeedService {

  googleShoppingFeedFileName = 'google_shopping_feed.xml';
  facebookShoppingFeedFileName = 'facebook_shopping_feed.xml';
  facebookShoppingLocalizationFeedFileName = 'localization_facebook_shopping_feed.xml';
  reviewsFeedFileName = 'google_shopping_review.xml';

  private websiteHostname = `https://klondike.com.ua`;

  constructor(
    private readonly productService: AdminProductService,
    private readonly categoryService: CategoryService,
    private readonly attributeService: AttributeService,
    private readonly reviewService: ProductReviewService,
    private readonly xmlBuilder: XmlBuilder,
    private readonly maintenanceService: MaintenanceService
  ) { }

  async generateShoppingAdsFeed(
    lang: Language,
    customizeFeedItemFunction?: (item: IShoppingFeedItem, variant: ProductVariantWithQty) => IShoppingFeedItem
  ): Promise<string> {

    this.checkForMaintenance();
    const items: IShoppingFeedItem[] = [];
    const products = await this.getAllProducts();

    for (const product of products) {
      if (!product.isEnabled) { continue; }

      let brand: string = await this.getBrand(product.attributes, lang);

      for (const variant of product.variants) {
        if (!variant.isEnabled || !variant.isIncludedInShoppingFeed) { continue; }

        if (!brand) {
          brand = await this.getBrand(variant.attributes, lang);
        }

        let price: number;
        let salePrice: number;
        if (variant.oldPriceInDefaultCurrency) {
          price = variant.oldPriceInDefaultCurrency;
          salePrice = variant.priceInDefaultCurrency;
        } else {
          price = variant.priceInDefaultCurrency;
        }

        const isFreeShippingAvailable: boolean = price >= priceThresholdForFreeShipping;
        const freeShipping = {
          'g:shipping': {
            'g:country': 'UA',
            'g:price': '0.00 UAH'
          }
        };
        let item: IShoppingFeedItem = {
          'g:id': { $: variant.sku },
          'g:title': ShoppingFeedService.getFeedItemTitle(variant, lang),
          'g:link': this.getGLink(variant, lang),
          'g:price': { $: `${price} UAH` },
          ...(salePrice ? { 'g:sale_price': { $: `${salePrice} UAH` } } : {}),
          'g:description': ShoppingFeedService.getFeedItemDescriptions(variant, lang),
          'g:condition': 'new',
          'g:brand': { $: brand },
          'g:mpn': { $: variant.vendorCode || '' },
          'g:gtin': { $: variant.gtin || '' },
          'g:identifier_exists': brand || variant.vendorCode || variant.gtin ? 'true' : 'false',
          'g:product_type': { $: await this.buildProductType(product.breadcrumbsVariants, Language.RU) },
          'g:availability': variant.qtyInStock > variant.reserved.reduce((sum, ordered) => sum + ordered.qty, 0)
            ? 'in stock' : 'out of stock',
          ...(isFreeShippingAvailable ? freeShipping : {})
        };

        if (customizeFeedItemFunction) {
          item = customizeFeedItemFunction(item, variant);
        }

        items.push(item);
      }
    }

    return this.getShoppingFeed(items);
  }

  private getGLink(variant: ProductVariantWithQty, lang: Language) {
    return Language.UK === lang ? { $: `${this.websiteHostname}/ua/${variant.slug}` }
      : { $: `${this.websiteHostname}/${variant.slug}` };
  }

  private getShoppingFeed(items: IShoppingFeedItem[]): string {
    const data = {
      rss: {
        '@': {
          version: '2.0',
          'xmlns:g': 'http://base.google.com/ns/1.0'
        },
        channel: {
          title: 'Data feed Klondike',
          link: this.websiteHostname,
          description: 'Data feed description.',
          item: items
        }
      }
    };

    return this.xmlBuilder.buildDocument(data);
  }

  private async getBrand(attributes: ProductSelectedAttribute[], lang: Language): Promise<string> {
    const manufacturerAttrId = 'manufacturer';
    const allAttributes = await this.attributeService.getAllAttributes();
    const manufacturerAttr = allAttributes.find(attr => attr.id === manufacturerAttrId);
    const selectedBrandAttr = attributes.find(attr => attr.attributeId === manufacturerAttrId);
    if (!selectedBrandAttr) { return ''; }

    return selectedBrandAttr.valueIds.reduce((acc, valueId) => {
      const value = manufacturerAttr.values.find(value => value.id === valueId);
      const label = value.label[lang].match(/\((.+)\)/)?.[1] || value.label[lang]; // get everything from inside "()", if any
      return acc ? `${acc}, ${label}` : label;
    }, '');
  }

  async generateGoogleShoppingAdsFeed(lang : Language): Promise<string> {
    return await this.generateShoppingAdsFeed(lang, (item, variant) => {
      let imageLink: string = '';
      let additionalImageLinks: string[] = [];
      variant.medias.forEach((media, idx) => {
        const link = this.websiteHostname + media.variantsUrls.original;

        if (idx === 0) {
          imageLink = link;
        } else {
          additionalImageLinks.push(link);
        }
      });

      return {
        ...item,
        'g:image_link': { $: imageLink },
        'g:custom_label_0': lang,
        ...(additionalImageLinks.length ? { 'g:additional_image_link': { $: additionalImageLinks as any } } : {}),
      };
    });
  }

  async generateFacebookShoppingAdsFeed(): Promise<string> {
    return await this.generateShoppingAdsFeed(Language.RU, (item, variant) => {
      let imageLink: string = '';
      let additionalImageLinks: string[] = [];
      variant.medias.forEach((media, idx) => {
        const variantUrl = media.variantsUrls[MediaVariantEnum.LargeSquare] || media.variantsUrls[MediaVariantEnum.Large];
        const link = `${this.websiteHostname}${variantUrl}`;

        if (idx === 0) {
          imageLink = link;
        } else if (idx === 1) { //TODO resolve support for multiple additionalImageLinks
          additionalImageLinks.push(link);
        }
      });

      return {
        ...item,
        'g:image_link': { $: imageLink },
        ...(additionalImageLinks.length ? { 'g:additional_image_link': { $: additionalImageLinks as any } } : {}),
      };
    });
  }

  async generateFacebookShoppingLocalizationFeed(lang : Language): Promise<string> {
    this.checkForMaintenance();

    const items: IShoppingFeedItem[] = [];
    for (const product of await this.getAllProducts()) {
      if (!product.isEnabled) { continue; }

      let brand: string = await this.getBrand(product.attributes, lang);

      for (const variant of product.variants) {
        if (!variant.isEnabled || !variant.isIncludedInShoppingFeed) { continue; }

        if (!brand) {
          brand = await this.getBrand(variant.attributes, lang);
        }

        let item: IShoppingFeedItem = {
          'g:id': { $: variant.sku },
          'g:override': { $: 'uk_UA' },
          'g:title': ShoppingFeedService.getFeedItemTitle(variant, lang),
          'g:link': this.getGLink(variant, lang),
          'g:description': ShoppingFeedService.getFeedItemDescriptions(variant, lang),
          'g:brand': { $: brand },
        };

        items.push(item);
      }
    }

    return this.getShoppingFeed(items);
  }

  async generateGoogleProductReviewsFeed(): Promise<string> {
    this.checkForMaintenance();

    const products = await this.getAllProducts();
    const reviewDtos = await this.getAllReviews();

    const reviews: IShoppingReview[] = [];

    reviewDtos.forEach(reviewDto => {
      const product = products.find(p => p._id === reviewDto.productId);
      if (!(product && product.isEnabled)) { return; }

      const productUrl = `${this.websiteHostname}/${product.variants[0].slug}`;
      const reviewsProducts: IShoppingReviewProduct[] = [];

      product.variants.forEach(variant => {
        const variantUrl = `${this.websiteHostname}/${variant.slug}`;

        reviewsProducts.push({
          product_ids: {
            mpns: {
              mpn: { $: variant.vendorCode || variant.sku }
            },
            skus: {
              sku: { $: variant.sku }
            }
          },
          product_name: { $: variant.name[Language.RU] },
          product_url: { $: variantUrl }
        });
      });

      reviews.push({
        review_id: reviewDto.id,
        reviewer: {
          name: { $: reviewDto.name }
        },
        review_timestamp: reviewDto.createdAt.toISOString(),
        content: { $: reviewDto.text },
        review_url: {
          '@type': 'singleton',
          $: productUrl
        },
        ratings: {
          overall: {
            '@': {
              min: 1,
              max: 5
            },
            '#': reviewDto.rating
          }
        },
        products: {
          product: reviewsProducts as any
        }
      });
    });

    const data = {
      feed: {
        '@': {
          'xmlns:vc': 'http://www.w3.org/2007/XMLSchema-versioning',
          'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          'xsi:noNamespaceSchemaLocation': 'http://www.google.com/shopping/reviews/schema/product/2.2/product_reviews.xsd'
        },
        version: '2.2',
        publisher: {
          name: 'Klondike online shop',
          link: `${this.websiteHostname}/favicon.ico`
        },
        reviews: {
          review: reviews
        }
      }
    };

    return this.xmlBuilder.buildDocument(data);
  }

  private async getAllProducts(): Promise<ProductWithQty[]> {
    const countProducts = await this.productService.countProducts();
    const spf = new AdminSPFDto();
    spf.limit = countProducts + 100;

    return this.productService.getProductsWithQty(spf);
  }

  private async getAllReviews(): Promise<AdminProductReviewDto[]> {
    const countReviews = await this.reviewService.countReviews();
    const spf = new AdminSPFDto();
    spf.limit = countReviews + 100;

    const responseDto = await this.reviewService.findReviewsByFilters(spf);
    return responseDto.data;
  }

  private async buildProductType(breadcrumbsVariants: BreadcrumbsVariant[], lang: Language): Promise<string> {
    const allCategories = await this.categoryService.getAllCategories();
    const activeBreadcrumbVariant = breadcrumbsVariants.find(breadcrumbsVariant => breadcrumbsVariant.isActive) || breadcrumbsVariants[0];

    return activeBreadcrumbVariant.categoryIds
      .map(categoryId => {
        const category = allCategories.find(category => category.id === categoryId && category.isEnabled);
        return category?.name[lang];
      })
      .filter(name => name)
      .join(' > ');
  }

  private static getFeedItemDescriptions(variant: ProductVariantWithQty, lang: Language) {
    const description = variant.fullDescription || variant.shortDescription || new MultilingualText();
    return { $: stripHtmlTags(description[lang]).replace(/\r?\n|\n/g, ' ') };
  }

  private static getFeedItemTitle(variant: ProductVariantWithQty, lang: Language) {
    const title = variant.googleAdsProductTitle[lang] || variant.name[lang];
    return { $: title && title.length > 150 ? title.substring(0, 150) : title };
  }

  private checkForMaintenance() {
    const maintenanceInfo = this.maintenanceService.getMaintenanceInfo()
    if (maintenanceInfo.isMaintenanceInProgress) {
      const message = `Service is under maintenance. Please, try again`
        + maintenanceInfo.maintenanceEndTime ? `in ${maintenanceInfo.maintenanceEndTime}` : `later`;
      throw new ServiceUnavailableException(message);
    }
  }
}
