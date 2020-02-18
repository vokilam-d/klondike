import { Injectable } from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { AdminSortingPaginatingFilterDto } from '../shared/dtos/admin/filter.dto';
import { AdminProductDto } from '../shared/dtos/admin/product.dto';
import { create } from 'xmlbuilder2/lib';

interface IShoppingFeedItem {
  'g:id': string;
  'g:title': string;
  'g:link': string;
  'g:price': string;
  'g:description': string;
  'g:product_type': string;
  'g:image_link': string;
  'g:additional_image_link'?: string | string[];
  'g:condition': string;
  'g:availability': string;
  'g:brand': string;
  'g:mpn': string;
  'g:gtin': string;
}

@Injectable()
export class GoogleShoppingFeedService {

  constructor(private readonly productService: ProductService) {
  }

  async generateShoppingAdsFeed() {
    const products = await this.getAllProducts();
    // const items = products.map()

    const feed = create({ version: '1.0' });

  }

  private async getAllProducts(): Promise<AdminProductDto[]> {
    const countProducts = await this.productService.countProducts();
    const spf = new AdminSortingPaginatingFilterDto();
    spf.limit = countProducts + 100;

    return this.productService.getAllProductsWithQty(spf);
  }
}
