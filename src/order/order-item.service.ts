import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { CustomerService } from '../customer/customer.service';
import { OrderItem } from './models/order-item.model';
import { __ } from '../shared/helpers/translate/translate.function';
import { LinkedProduct } from '../product/models/linked-product.model';
import { ClientProductListItemDto } from '../shared/dtos/client/product-list-item.dto';
import { ClientProductSPFDto } from '../shared/dtos/client/product-spf.dto';
import { queryParamArrayDelimiter } from '../shared/constants';

@Injectable()
export class OrderItemService {
  constructor(private readonly productService: ProductService,
              private readonly customerService: CustomerService) {
  }

  async createOrderItem(sku: string, qty: number, customerId?: number, migrate?): Promise<OrderItem> {
    const foundProduct = await this.productService.getProductWithQtyBySku(sku);
    if (!foundProduct) {
      throw new BadRequestException(__('Product with sku "$1" not found', 'ru', sku));
    }
    const variant = foundProduct.variants.find(v => v.sku === sku);

    if (!migrate) { // todo remove this line after migrate
      if (variant.qtyInStock < qty) {
        throw new ForbiddenException(__('Not enough quantity in stock. You are trying to add: $1. In stock: $2', 'ru', qty, variant.qtyInStock));
      }
    }

    const orderItem = new OrderItem();
    orderItem.name = variant.name;
    orderItem.slug = variant.slug;
    orderItem.productId = foundProduct._id;
    orderItem.variantId = variant._id.toString();
    orderItem.sku = variant.sku;
    orderItem.vendorCode = variant.vendorCode;
    if (variant.medias[0]) {
      orderItem.imageUrl = variant.medias[0].variantsUrls.small;
    }

    orderItem.qty = qty;
    if (variant.oldPriceInDefaultCurrency) {
      orderItem.price = variant.oldPriceInDefaultCurrency;
      orderItem.discountValue = (variant.oldPriceInDefaultCurrency - variant.priceInDefaultCurrency) * orderItem.qty;
    } else {
      orderItem.price = variant.priceInDefaultCurrency;

      if (variant.isDiscountApplicable && customerId) {
        const customer = await this.customerService.getCustomerById(customerId);
        orderItem.discountValue = Math.round(orderItem.price * orderItem.qty * customer.discountPercent / 100);
      } else {
        orderItem.discountValue = 0;
      }
    }

    orderItem.originalPrice = orderItem.price; // todo is this field necessary?
    orderItem.cost = orderItem.price * orderItem.qty;
    orderItem.totalCost = orderItem.cost - orderItem.discountValue;

    if (!migrate) {
      orderItem.crossSellProducts = await this.getCrossSellProducts(variant.crossSellProducts);
    }

    return orderItem;
  }

  private async getCrossSellProducts(crossSellProducts: LinkedProduct[]): Promise<ClientProductListItemDto[]> {
    if (!crossSellProducts.length) { return []; }

    crossSellProducts.sort((a, b) => b.sortOrder - a.sortOrder);
    const idsArr = crossSellProducts.map(p => p.productId);

    const spf = new ClientProductSPFDto();
    spf.limit = crossSellProducts.length;
    spf.id = idsArr.join(queryParamArrayDelimiter);
    const { data: products } = await this.productService.getClientProductList(spf);

    products.sort((a, b) => {
      const indexOfA = idsArr.indexOf(a.productId);
      const indexOfB = idsArr.indexOf(b.productId);

      if (indexOfA > indexOfB) {
        return 1;
      } else if (indexOfA < indexOfB) {
        return -1;
      } else {
        return 0;
      }
    });

    return products;
  }
}
