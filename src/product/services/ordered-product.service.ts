import { Injectable } from '@nestjs/common';
import { ProductService } from './product.service';
import { AdminProductListItemDto } from '../../shared/dtos/admin/product-list-item.dto';
import { Product } from '../models/product.model';
import { ElasticProduct } from '../models/elastic-product.model';
import { SearchService } from '../../shared/services/search/search.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { AdminProductSPFDto } from '../../shared/dtos/admin/product-spf.dto';
import { OrderService } from '../../order/order.service';

@Injectable()
export class OrderedProductService {

  constructor(private readonly productService: ProductService,
              private readonly orderService: OrderService,
              private readonly searchService: SearchService
  ) { }

  async getAdminOrderedProductsList(spf: AdminProductSPFDto, orderedDates: string[]): Promise<ResponseDto<AdminProductListItemDto[]>> {
    const orderedSalesCountMap = await this.getOrderedSalesCountMap(orderedDates);
    if (orderedSalesCountMap.size === 0) {
      return { data: [], page: spf.page, pagesTotal: 0, itemsTotal: await this.productService.countProducts(), itemsFiltered: 0 };
    }

    let sort = spf.getSortAsObj();
    const salesCountProp: keyof AdminProductListItemDto = 'salesCount';

    const sortBySalesCountDirection = sort[salesCountProp];
    if (sortBySalesCountDirection) {
      delete sort[salesCountProp];
    }

    const filters = await this.productService.buildAdminFilters(spf);
    filters.push({ fieldName: 'id', values: Array.from(orderedSalesCountMap.keys()) })

    let [ products, itemsFiltered ] = await this.searchService.searchByFilters<AdminProductListItemDto>(
      Product.collectionName,
      filters,
      0,
      10000,
      sort,
      undefined,
      new ElasticProduct()
    );

    for (let product of products) {
      const salesCount = orderedSalesCountMap.get(product.id);
      product.variants[0].salesCount = salesCount;

      product.salesCount = product.variants.reduce((acc, variant) => acc + variant.salesCount, 0);
    }

    if (sortBySalesCountDirection) {
      products.sort((a, b) => {
        if (sortBySalesCountDirection === 'desc') {
          return b.salesCount - a.salesCount;
        } else {
          return a.salesCount - b.salesCount;
        }
      });
    }

    products = products.slice(spf.skip, spf.skip + spf.limit);

    return {
      data: products,
      page: spf.page,
      pagesTotal: Math.ceil((itemsFiltered) / spf.limit),
      itemsTotal: await this.productService.countProducts(),
      itemsFiltered
    };
  }

  private async getOrderedSalesCountMap(orderedDates: string[]): Promise<Map<number, number>> {
    const shippedOrders = await this.orderService.findShippedOrdersByDate(orderedDates);

    const countMap = new Map();
    for (const order of shippedOrders) {
      for (const item of order.items) {
        const id = item.productId;
        const count = (countMap.get(id) || 0) + item.qty;
        countMap.set(id, count);
      }
    }

    return countMap;
  }
}
