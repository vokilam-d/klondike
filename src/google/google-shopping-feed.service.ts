import { Injectable } from '@nestjs/common';
import { ProductService } from '../product/services/product.service';
import { AdminSPFDto } from '../shared/dtos/admin/spf.dto';
import { create } from 'xmlbuilder2/lib';
import { stripHtmlTags } from '../shared/helpers/strip-html-tags.function';
import { Breadcrumb } from '../shared/models/breadcrumb.model';
import { ProductReviewService } from '../reviews/product-review/product-review.service';
import { AdminProductReviewDto } from '../shared/dtos/admin/product-review.dto';
import { ProductWithQty } from '../product/models/product-with-qty.model';
import { AttributeService } from '../attribute/attribute.service';
import { ProductSelectedAttribute } from '../product/models/product-selected-attribute.model';
import { clientDefaultLanguage, priceThresholdForFreeShipping } from '../shared/constants';
import { MultilingualText } from '../shared/models/multilingual-text.model';

type cdata = { $: string };

interface IShoppingFeedItem {
  'g:id': cdata;
  'g:title': cdata;
  'g:link': cdata;
  'g:price': cdata;
  'g:sale_price'?: cdata;
  'g:description': cdata;
  'g:product_type': cdata;
  'g:image_link'?: cdata;
  'g:additional_image_link'?: cdata;
  'g:condition': string;
  'g:availability': string;
  'g:brand': cdata;
  'g:mpn': cdata;
  'g:gtin': cdata;
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
export class GoogleShoppingFeedService {

  shoppingFeedFileName = 'google_shopping_feed.xml';
  reviewsFeedFileName = 'google_shopping_review.xml';

  constructor(private readonly productService: ProductService,
              private readonly attributeService: AttributeService,
              private readonly reviewService: ProductReviewService) {
  }

  async generateShoppingAdsFeed(): Promise<string> {
    const manufacturerAttrId = 'manufacturer';
    const attributes = await this.attributeService.getAllAttributes();
    const manufacturerAttr = attributes.find(attr => attr.id === manufacturerAttrId);

    const products = await this.getAllProducts();
    const items: IShoppingFeedItem[] = [];

    const getBrand = (attributes: ProductSelectedAttribute[]): string => {
      const selectedBrandAttr = attributes.find(attr => attr.attributeId === manufacturerAttrId);
      if (!selectedBrandAttr) { return ''; }

      return selectedBrandAttr.valueIds.reduce((acc, valueId) => {
        const value = manufacturerAttr.values.find(value => value.id === valueId);
        const label = value.label[clientDefaultLanguage].match(/\((.+)\)/)?.[1] || value.label[clientDefaultLanguage]; // get everything from inside "()", if any

        return acc ? `${acc}, ${label}` : label;
      }, '');
    }

    products.forEach(product => {
      if (!product.isEnabled) { return; }

      let brand: string = getBrand(product.attributes);

      product.variants.forEach(variant => {
        if (!variant.isEnabled || !variant.isIncludedInShoppingFeed) { return; }

        const description = variant.fullDescription || variant.shortDescription || new MultilingualText();

        let imageLink: string;
        let additionalImageLinks: string[] = [];
        variant.medias.forEach((media, idx) => {
          const link = 'http://klondike.com.ua' + media.variantsUrls.original;

          if (idx === 0) {
            imageLink = link;
          } else {
            additionalImageLinks.push(link);
          }
        });

        if (!brand) {
          brand = getBrand(variant.attributes);
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

        const item: IShoppingFeedItem = {
          'g:id': { $: variant.sku },
          'g:title': { $: variant.googleAdsProductTitle[clientDefaultLanguage] || variant.name[clientDefaultLanguage] },
          'g:link': { $: `http://klondike.com.ua/${variant.slug}` },
          'g:price': { $: `${price} UAH` },
          ...(salePrice ? { 'g:sale_price': { $: `${salePrice} UAH` } } : {}),
          'g:description': { $: stripHtmlTags(description[clientDefaultLanguage]).replace(/\r?\n|\n/g, ' ') },
          'g:product_type': { $: this.buildProductType(product.breadcrumbs) },
          ...(imageLink ? {'g:image_link': { $: imageLink }} : {}),
          ...(additionalImageLinks.length ? {'g:additional_image_link': { $: additionalImageLinks as any }}: {}),
          'g:condition': 'new',
          'g:availability': variant.qtyInStock > variant.reserved.reduce((sum, ordered) => sum + ordered.qty, 0) ? 'in_stock' : 'out_of_stock',
          'g:brand': { $: brand },
          'g:mpn': { $: variant.vendorCode || '' },
          'g:gtin': { $: variant.gtin || '' },
          ...(isFreeShippingAvailable ? freeShipping : {})
        };

        items.push(item);
      })
    });

    const doc = create({ version: '1.0' }).ele({
      rss: {
        '@': {
          version: '2.0',
          'xmlns:g': 'http://base.google.com/ns/1.0'
        },
        channel: {
          title: 'Data feed Klondike',
          link: 'https://klondike.com.ua/',
          description: 'Data feed description.',
          item: items
        }
      }
    });

    const feed = doc.end({ prettyPrint: true, allowEmptyTags: true });
    return feed.toString();
  }

  async generateProductReviewsFeed(): Promise<string> {
    const products = await this.getAllProducts();
    const reviewDtos = await this.getAllReviews();

    const reviews: IShoppingReview[] = [];

    reviewDtos.forEach(reviewDto => {
      const product = products.find(p => p._id === reviewDto.productId);
      if (!(product && product.isEnabled)) { return; }

      const productUrl = `https://klondike.com.ua/${product.variants[0].slug}`;
      const reviewsProducts: IShoppingReviewProduct[] = [];

      product.variants.forEach(variant => {
        const variantUrl = `https://klondike.com.ua/${variant.slug}`;

        reviewsProducts.push({
          product_ids: {
            mpns: {
              mpn: { $: variant.vendorCode || variant.sku }
            },
            skus: {
              sku: { $: variant.sku }
            }
          },
          product_name: { $: variant.name[clientDefaultLanguage] },
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

    const doc = create({ version: '1.0' }).ele({
      feed: {
        '@': {
          'xmlns:vc': 'http://www.w3.org/2007/XMLSchema-versioning',
          'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          'xsi:noNamespaceSchemaLocation': 'http://www.google.com/shopping/reviews/schema/product/2.2/product_reviews.xsd'
        },
        version: '2.2',
        publisher: {
          name: 'Klondike online shop',
          link: 'https://klondike.com.ua/favicon.ico'
        },
        reviews: {
          review: reviews
        }
      }
    });

    const feed = doc.end({ prettyPrint: true, allowEmptyTags: true });

    return feed.toString();
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

  private buildProductType(breadcrumbs: Breadcrumb[]): string {
    return breadcrumbs.map(breadcrumb => breadcrumb.name[clientDefaultLanguage]).join(' > ');
  }
}
