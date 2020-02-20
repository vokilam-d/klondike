import { Injectable } from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { AdminSortingPaginatingFilterDto } from '../shared/dtos/admin/filter.dto';
import { AdminProductDto } from '../shared/dtos/admin/product.dto';
import { create } from 'xmlbuilder2/lib';
import { stripHtmlTags } from '../shared/helpers/strip-html-tags.function';
import { ProductBreadcrumb } from '../product/models/product-breadcrumb.model';

type cdata = { $: string }
interface IShoppingFeedItem {
  'g:id': cdata;
  'g:title': cdata;
  'g:link': cdata;
  'g:price': cdata;
  'g:description': cdata;
  'g:product_type': cdata;
  'g:image_link': cdata;
  'g:additional_image_link'?: cdata | cdata[];
  'g:condition': string;
  'g:availability': string;
  'g:brand': cdata;
  'g:mpn': cdata;
  'g:gtin': cdata;
}

@Injectable()
export class GoogleShoppingFeedService {

  shoppingFeedFileName = 'google_shopping_feed.xml';

  constructor(private readonly productService: ProductService) {
  }

  async generateShoppingAdsFeed(): Promise<string> {
    const products = await this.getAllProducts();
    const items: IShoppingFeedItem[] = [];

    products.forEach(product => {
      if (!product.isEnabled) { return; }

      let brand = '';
      const productBrandAttr = product.attributes.find(attr => attr.valueId === 'manufacturer');
      if (productBrandAttr) {
        brand = productBrandAttr.valueId;
      }

      product.variants.forEach(variant => {
        if (!variant.isEnabled) { return; }

        let imageLink: string;
        let additionalImageLinks: string[];
        variant.medias.forEach((media, idx) => {
          const link = 'http://klondike.com.ua' + media.variantsUrls.original;

          if (idx === 0) {
            imageLink = link;
          } else {
            additionalImageLinks = additionalImageLinks || [];
            additionalImageLinks.push(link);
          }
        });

        const variantBrandAttr = variant.attributes.find(attr => attr.valueId === 'manufacturer');
        if (variantBrandAttr) {
          brand = variantBrandAttr.valueId;
        }

        const item: any = {
          'g:id': { $: variant.sku },
          'g:title': { $: variant.googleAdsProductTitle || variant.name },
          'g:link': { $: `http://klondike.com.ua/${variant.slug}.html` },
          'g:price': { $: `${variant.priceInDefaultCurrency} UAH` },
          'g:description': { $: stripHtmlTags(variant.fullDescription).replace(/\r?\n|\n/g, ' ') },
          'g:product_type': { $: this.buildProductType(product.breadcrumbs) },
          'g:image_link': { $: imageLink },
          'g:additional_image_link': { $: additionalImageLinks },
          'g:condition': 'new',
          'g:availability': 'in stock',
          'g:brand': { $: brand },
          'g:mpn': { $: variant.vendorCode || '' },
          'g:gtin': { $: variant.gtin || '' }
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

  private async getAllProducts(): Promise<AdminProductDto[]> {
    const countProducts = await this.productService.countProducts();
    const spf = new AdminSortingPaginatingFilterDto();
    spf.limit = countProducts + 100;

    return this.productService.getAllProductsWithQty(spf);
  }

  private buildProductType(breadcrumbs: ProductBreadcrumb[]): string {
    return breadcrumbs.map(breadcrumb => breadcrumb.name).join(' > ');
  }
}
