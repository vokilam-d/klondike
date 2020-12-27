import { Expose, Type } from 'class-transformer';
import { Customer } from '../../../customer/models/customer.model';
import { ShipmentAddressDto } from '../shared-dtos/shipment-address.dto';
import { ClientOrderItemDto } from './order-item.dto';
import { Language } from '../../enums/language.enum';

export class ClientCustomerDto implements
  Pick<Customer, 'id' | 'firstName' | 'lastName' | 'email' | 'phoneNumber' | 'addresses' | 'isEmailConfirmed' | 'totalOrdersCount' | 'totalOrdersCost' | 'discountPercent' | 'orderIds' | 'reviewIds' | 'wishlistProductIds'>,
  Record<keyof Pick<Customer, 'cart'>, ClientOrderItemDto[]> {
  @Expose()
  id: number;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  phoneNumber: string;

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
  reviewIds: number[];

  @Expose()
  wishlistProductIds: number[];

  static transformToDto(customer: Customer, lang: Language): ClientCustomerDto {
    return {
      addresses: customer.addresses,
      cart: customer.cart.map(item => ClientOrderItemDto.transformToDto(item, lang)),
      discountPercent: customer.discountPercent,
      email: customer.email,
      firstName: customer.firstName,
      id: customer.id,
      isEmailConfirmed: customer.isEmailConfirmed,
      lastName: customer.lastName,
      orderIds: customer.orderIds,
      phoneNumber: customer.phoneNumber,
      reviewIds: customer.reviewIds,
      totalOrdersCost: customer.totalOrdersCost,
      totalOrdersCount: customer.totalOrdersCount,
      wishlistProductIds: customer.wishlistProductIds
    };
  }
}
