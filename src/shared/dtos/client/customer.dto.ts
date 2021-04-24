import { Expose, Type } from 'class-transformer';
import { Customer } from '../../../customer/models/customer.model';
import { ShipmentAddressDto } from '../shared-dtos/shipment-address.dto';
import { ClientOrderItemDto } from './order-item.dto';
import { Language } from '../../enums/language.enum';
import { CustomerContactInfoDto } from '../shared-dtos/customer-contact-info.dto';

export class ClientCustomerDto implements
  Pick<Customer, 'id' | 'contactInfo' | 'addresses' | 'isEmailConfirmed' | 'totalOrdersCount' | 'totalOrdersCost' | 'discountPercent' | 'orderIds' | 'storeReviewIds' | 'productReviewIds' | 'wishlistProductIds'>,
  Record<keyof Pick<Customer, 'cart'>, ClientOrderItemDto[]> {
  @Expose()
  id: number;

  @Expose()
  contactInfo: CustomerContactInfoDto;

  @Expose()
  cart: ClientOrderItemDto[];

  @Expose()
  @Type(() => ShipmentAddressDto)
  addresses: ShipmentAddressDto[];

  @Expose()
  isEmailConfirmed: boolean;

  @Expose()
  totalOrdersCount: number;

  @Expose()
  totalOrdersCost: number;

  @Expose()
  discountPercent: number;

  @Expose()
  orderIds: number[];

  @Expose()
  storeReviewIds: number[];

  @Expose()
  productReviewIds: number[];

  @Expose()
  wishlistProductIds: number[];

  static transformToDto(customer: Customer, lang: Language): ClientCustomerDto {
    return {
      addresses: customer.addresses,
      cart: customer.cart.map(item => ClientOrderItemDto.transformToDto(item, lang)),
      discountPercent: customer.discountPercent,
      contactInfo: customer.contactInfo,
      id: customer.id,
      isEmailConfirmed: customer.isEmailConfirmed,
      orderIds: customer.orderIds,
      storeReviewIds: customer.storeReviewIds,
      productReviewIds: customer.productReviewIds,
      totalOrdersCost: customer.totalOrdersCost,
      totalOrdersCount: customer.totalOrdersCount,
      wishlistProductIds: customer.wishlistProductIds
    };
  }
}
