import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { ProductService } from '../product/services/product.service';
import { CustomerService } from '../customer/customer.service';
import { OrderItem } from './models/order-item.model';
import { __, getTranslations } from '../shared/helpers/translate/translate.function';
import { LinkedProduct } from '../product/models/linked-product.model';
import { ClientProductListItemDto } from '../shared/dtos/client/product-list-item.dto';
import { ClientProductSPFDto } from '../shared/dtos/client/product-spf.dto';
import { queryParamArrayDelimiter } from '../shared/constants';
import { Customer } from '../customer/models/customer.model';
import { ProductVariantWithQty, ProductWithQty } from '../product/models/product-with-qty.model';
import { OrderPrices } from '../shared/models/order-prices.model';
import { EProductsSort } from '../shared/enums/product-sort.enum';
import { AdditionalServiceService } from '../additional-service/services/additional-service.service';
import { ClientOrderItemDto } from '../shared/dtos/client/order-item.dto';
import { MultilingualText } from '../shared/models/multilingual-text.model';
import { CreateOrderItemDto } from '../shared/dtos/shared-dtos/create-order-item.dto';
import { Language } from '../shared/enums/language.enum';

const TOTAL_COST_DISCOUNT_BREAKPOINTS: { totalCostBreakpoint: number, discountPercent: number }[] = [
  { totalCostBreakpoint: 500, discountPercent: 5 },
  { totalCostBreakpoint: 1500, discountPercent: 10 }
]

@Injectable()
export class OrderItemService {
  constructor(
    @Inject(forwardRef(() => CustomerService)) private readonly customerService: CustomerService,
    private readonly productService: ProductService,
    private readonly additionalServiceService: AdditionalServiceService
  ) { }

  async createOrderItem(
    { sku, qty, additionalServiceIds, omitReserved }: CreateOrderItemDto,
    lang: Language,
    withCrossSell: boolean,
    product?: ProductWithQty,
    variant?: ProductVariantWithQty
  ): Promise<OrderItem> {

    if (!product) {
      product = await this.productService.getProductWithQtyBySku(sku);
      variant = product?.variants.find(v => v.sku === sku);
      if (!product || !variant) { throw new BadRequestException(__('Product with sku "$1" not found', 'ru', sku)); }
    }

    this.assertIsInStock(qty, variant, omitReserved);

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

    orderItem.additionalServices = [];
    let servicesCost: number = 0;
    for (const additionalServiceId of (additionalServiceIds || [])) {
      const additionalService = await this.additionalServiceService.getAdditionalServiceById(additionalServiceId);
      if (!additionalService) { continue; }

      orderItem.additionalServices.push({
        id: additionalService.id,
        name: additionalService.clientName,
        price: additionalService.price
      });

      servicesCost += additionalService.price;
    }

    orderItem.price = variant.priceInDefaultCurrency;
    orderItem.oldPrice = variant.oldPriceInDefaultCurrency;
    orderItem.qty = qty;
    orderItem.cost = (orderItem.price * orderItem.qty) + servicesCost;
    if (orderItem.oldPrice) {
      orderItem.oldCost = (orderItem.oldPrice * orderItem.qty) + servicesCost;
    }

    if (withCrossSell) {
      orderItem.crossSellProducts = await this.getCrossSellProducts(variant.crossSellProducts, lang);
    }

    return orderItem;
  }

  assertIsInStock(qty: number, variant: ProductVariantWithQty, omitReserved: boolean): void {
    const reservedAmount = variant.reserved?.reduce((sum, ordered) => sum + ordered.qty, 0);
    const qtyAvailable = omitReserved ? variant.qtyInStock : variant.qtyInStock - reservedAmount;

    if (qty > qtyAvailable) {
      throw new ForbiddenException(__('Not enough quantity in stock. You are trying to add: $1. In stock: $2', 'ru', qty, qtyAvailable));
    }
  }

  async calcOrderPrices(orderItems: (OrderItem | ClientOrderItemDto)[], customer: Customer): Promise<OrderPrices> {
    const products = await this.productService.getProductsWithQtyBySkus(orderItems.map(item => item.sku));

    // Sum of real cost of each item (based on its actual price) = (price * quantity)
    let itemsRealCost: number = 0;

    // Sum of old costs of each item (based on its old price) = (oldPrice * quantity)
    let itemsOldCost: number = 0;

    // Sum of real costs of each item, that IS applicable for discounts (isDiscountApplicable === true && oldPrice === null)
    let itemsCostApplicableForDiscount: number = 0;

    // Sum of real costs of each item, that CAN be applicable for discounts (isDiscountApplicable === true)
    // Based on this value is calculated discount percent, that later applies to __itemsCostApplicableForDiscount__ value
    let itemsCostForDiscountPercentCalculation: number = 0;

    // Sum of "discounts" of items, that have old price, i.e diff between old price and real price = (oldPrice - price)
    let oldPriceDiscounts: number = 0;

    for (const orderItem of orderItems) {
      const product = products.find(product => product._id === orderItem.productId);
      const variant = product?.variants.find(variant => variant._id.equals(orderItem.variantId));
      if (!product || !variant) {
        throw new BadRequestException(__('Product with sku "$1" not found', 'ru', orderItem.sku));
      }

      const itemCost = orderItem.qty * variant.priceInDefaultCurrency;
      itemsRealCost += itemCost;
      if (variant.oldPriceInDefaultCurrency) {
        itemsOldCost += orderItem.qty * variant.oldPriceInDefaultCurrency;
      } else {
        itemsOldCost += itemCost;
      }

      if (variant.isDiscountApplicable) {
        itemsCostForDiscountPercentCalculation += itemCost;

        if (variant.oldPriceInDefaultCurrency) {
          oldPriceDiscounts += (variant.oldPriceInDefaultCurrency - variant.priceInDefaultCurrency);
        } else {
          itemsCostApplicableForDiscount += itemCost;
        }
      }
    }

    const customerDiscountPercent: number = customer?.discountPercent ?? 0;
    const totalCostDiscountPercent = OrderItemService.getDiscountPercent(itemsCostForDiscountPercentCalculation);

    let resultDiscountPercent: number = 0;
    if (totalCostDiscountPercent > customerDiscountPercent) {
      resultDiscountPercent = totalCostDiscountPercent;
    } else if (customerDiscountPercent >= totalCostDiscountPercent) {
      resultDiscountPercent = customerDiscountPercent;
    }

    const applicableDiscountValue = Math.round(itemsCostApplicableForDiscount * resultDiscountPercent / 100);
    const totalCost = itemsRealCost - applicableDiscountValue;
    const discountValueIncludingOldPrice = applicableDiscountValue + oldPriceDiscounts;

    return {
      discountValue: discountValueIncludingOldPrice,
      itemsCost: itemsOldCost,
      totalCost
    };
  }

  private async getCrossSellProducts(crossSellProducts: LinkedProduct[], lang: Language): Promise<ClientProductListItemDto[]> {
    if (!crossSellProducts.length) { return []; }

    const idsArr = crossSellProducts.map(p => p.productId);

    const spf = new ClientProductSPFDto();
    spf.limit = crossSellProducts.length;
    spf.id = idsArr.join(queryParamArrayDelimiter);
    spf.sort = EProductsSort.SalesCount;
    let { data: products } = await this.productService.getClientProductList(spf, lang);

    return products.filter(product => product.isInStock);
  }

  private static getDiscountPercent(totalCost: number): number {
    let discountPercent: number = 0;

    for (const DISCOUNT_BREAKPOINT of TOTAL_COST_DISCOUNT_BREAKPOINTS) {
      if (totalCost >= DISCOUNT_BREAKPOINT.totalCostBreakpoint) {
        discountPercent = DISCOUNT_BREAKPOINT.discountPercent;
      }
    }

    return discountPercent;
  }
}
