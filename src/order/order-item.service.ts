import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { OrderItem } from './models/order.model';
import { CustomerService } from '../customer/customer.service';

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
    orderItem.sku = variant.sku;
    orderItem.originalPrice = variant.price;
    orderItem.price = variant.price;
    orderItem.qty = qty;
    orderItem.cost = orderItem.price * orderItem.qty;
    orderItem.discountPercent = 0;

    if (variant.isDiscountApplicable && customerId) {
      const customer = await this.customerService.getCustomerById(customerId);
      orderItem.discountPercent = customer.discountPercent;
    }

    orderItem.totalCost = Math.round(orderItem.cost - (orderItem.cost * orderItem.discountPercent / 100));

    return orderItem;
  }
}
