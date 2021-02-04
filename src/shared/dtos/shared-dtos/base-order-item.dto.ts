import { Expose } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';
import { BaseOrderItemAdditionalServiceDto } from './base-order-item-additional-service.dto';
import { OrderItem } from '../../../order/models/order-item.model';

export abstract class BaseOrderItemDto implements Omit<OrderItem, 'isPacked'> {
  abstract name: any;

  @Expose()
  @IsNumber()
  productId: number;

  @Expose()
  @IsString()
  @TrimString()
  variantId: string;

  @Expose()
  @IsString()
  @TrimString()
  sku: string;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  vendorCode: string;

  @Expose()
  @IsNumber()
  price: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  oldPrice: number;

  @Expose()
  @IsNumber()
  qty: number;

  @Expose()
  @IsNumber()
  cost: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  oldCost: number;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  imageUrl: string;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  slug: string;

  abstract additionalServices: BaseOrderItemAdditionalServiceDto[];
}
