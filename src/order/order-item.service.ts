import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { ProductService } from '../product/services/product.service';
import { CustomerService } from '../customer/customer.service';
import { OrderItem } from './models/order-item.model';
import { __ } from '../shared/helpers/translate/translate.function';
import { LinkedProduct } from '../product/models/linked-product.model';
import { ClientProductListItemDto } from '../shared/dtos/client/product-list-item.dto';
import { ClientProductSPFDto } from '../shared/dtos/client/product-spf.dto';
import { queryParamArrayDelimiter } from '../shared/constants';
import { Customer } from '../customer/models/customer.model';
import { ProductVariantWithQty, ProductWithQty } from '../product/models/product-with-qty.model';
import { OrderPrices } from '../shared/models/order-prices.model';

const TOTAL_COST_DISCOUNT_BREAKPOINTS: { totalCostBreakpoint: number, discountPercent: number }[] = [
  { totalCostBreakpoint: 500, discountPercent: 5 },
  { totalCostBreakpoint: 1500, discountPercent: 15 }
]

@Injectable()
export class OrderItemService {
  constructor(private readonly productService: ProductService,
              @Inject(forwardRef(() => CustomerService)) private readonly customerService: CustomerService
  ) { }

  async createOrderItem(sku: string, qty: number, withCrossSell: boolean, product?: ProductWithQty, variant?: ProductVariantWithQty): Promise<OrderItem> {

    if (!product) {
      product = await this.productService.getProductWithQtyBySku(sku);
      variant = product?.variants.find(v => v.sku === sku);
      if (!product || !variant) { throw new BadRequestException(__('Product with sku "$1" not found', 'ru', sku)); }
    }

    this.assertIsInStock(qty, variant);

    let orderItem = new OrderItem();
    orderItem.name = variant.name;
    orderItem.slug = variant.slug;
    orderItem.productId = product._id;
    orderItem.variantId = variant._id.toString();
    orderItem.sku = variant.sku;
    orderItem.vendorCode = variant.vendorCode;
    if (variant.medias[0]) {
      orderItem.imageUrl = variant.medias[0].variantsUrls.small;
    }

    orderItem.price = variant.oldPriceInDefaultCurrency ? variant.oldPriceInDefaultCurrency : variant.priceInDefaultCurrency;
    orderItem.qty = qty;
    orderItem.cost = orderItem.price * orderItem.qty;

    if (withCrossSell) {
      orderItem.crossSellProducts = await this.getCrossSellProducts(variant.crossSellProducts);
    }

    return orderItem;
  }

  assertIsInStock(qty: number, variant: ProductVariantWithQty): void {
    const qtyAvailable = variant.qtyInStock - variant.reserved?.reduce((sum, ordered) => sum + ordered.qty, 0);
    if (qty > qtyAvailable) {
      throw new ForbiddenException(__('Not enough quantity in stock. You are trying to add: $1. In stock: $2', 'ru', qty, variant.qtyInStock));
    }
  }

  async calcOrderPrices(orderItems: OrderItem[], customer: Customer): Promise<OrderPrices> {
    const products = await this.productService.getProductsWithQtyBySkus(orderItems.map(item => item.sku));
    let itemsCost: number = 0;
    let itemsCostApplicableForDiscount: number = 0;

    for (const orderItem of orderItems) {
      const product = products.find(product => product._id === orderItem.productId);
      const variant = product?.variants.find(variant => variant._id.equals(orderItem.variantId));
      if (!product || !variant) {
        throw new BadRequestException(__('Product with sku "$1" not found', 'ru', orderItem.sku));
      }

      itemsCost += orderItem.cost;
      if (variant.isDiscountApplicable && variant.oldPriceInDefaultCurrency) {
        itemsCostApplicableForDiscount += orderItem.cost;
      }
    }

    const customerDiscountPercent: number = customer?.discountPercent ?? 0;
    const [totalCostDiscountPercent, totalCostBreakpoint] = OrderItemService.getDiscountPercent(itemsCostApplicableForDiscount);

    let discountPercent: number = 0;
    let discountLabel: string = '';
    if (totalCostDiscountPercent > customerDiscountPercent) {
      discountPercent = totalCostDiscountPercent;
      discountLabel = __('Order amount over $1 uah', 'ru', totalCostBreakpoint);
    } else if (customerDiscountPercent > totalCostDiscountPercent) {
      discountPercent = customerDiscountPercent;
      discountLabel = __('Cumulative discount', 'ru');
    }

    const discountValue = Math.round(itemsCostApplicableForDiscount * discountPercent / 100);
    const totalCost = itemsCost - discountValue;

    return {
      discountPercent,
      discountValue,
      discountLabel,
      itemsCost,
      totalCost
    };
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

  private static getDiscountPercent(totalCost: number): [number, number] {
    let discountPercent: number = 0;
    let breakpoint: number = 0;

    for (const DISCOUNT_BREAKPOINT of TOTAL_COST_DISCOUNT_BREAKPOINTS) {
      if (totalCost >= DISCOUNT_BREAKPOINT.totalCostBreakpoint) {
        breakpoint = DISCOUNT_BREAKPOINT.totalCostBreakpoint;
        discountPercent = DISCOUNT_BREAKPOINT.discountPercent;
      }
    }

    return [discountPercent, breakpoint];
  }
}
