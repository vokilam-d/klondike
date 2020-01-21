import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { CustomerService } from '../customer/customer.service';
import { OrderItem } from './models/order-item.model';

@Injectable()
export class OrderItemService {
  constructor(private readonly productService: ProductService,
              private readonly customerService: CustomerService) {
  }

  async createOrderItem(sku: string, qty: number, customerId?: number): Promise<OrderItem> {
    const foundProduct = await this.productService.getProductWithQtyBySku(sku);
    if (!foundProduct) {
      throw new BadRequestException(`Product with sku '${sku}' not found`);
    }
    const variant = foundProduct.variants.find(v => v.sku === sku);

    if (variant.qty < qty) {
      throw new ForbiddenException(`Not enough quantity in stock. You are trying to add: ${qty}. In stock: ${variant.qty}`);
    }

    const orderItem = new OrderItem();
    orderItem.name = variant.name;
    orderItem.productId = foundProduct._id;
    orderItem.variantId = variant._id;
    orderItem.sku = variant.sku;
    if (variant.medias[0]) {
      orderItem.imageUrl = variant.medias[0].variantsUrls.small;
    }
    orderItem.originalPrice = variant.price;
    orderItem.price = variant.price;
    orderItem.qty = qty;
    orderItem.cost = orderItem.price * orderItem.qty;
    orderItem.discountValue = 0;

    if (variant.isDiscountApplicable && customerId) {
      const customer = await this.customerService.getCustomerById(customerId);
      orderItem.discountValue = Math.round(orderItem.cost * customer.discountPercent / 100);
    }

    orderItem.totalCost = orderItem.cost - orderItem.discountValue;
    return orderItem;
  }
}
