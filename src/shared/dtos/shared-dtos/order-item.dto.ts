import { Expose, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ClientProductListItemDto } from '../client/product-list-item.dto';
import { TrimString } from '../../decorators/trim-string.decorator';
import { OrderItemAdditionalServiceDto } from './order-item-additional-service.dto';

export class OrderItemDto {
  @Expose()
  @IsString()
  @TrimString()
  name: string;

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

  @Expose()
  @Type(() => OrderItemAdditionalServiceDto)
  additionalServices: OrderItemAdditionalServiceDto[];

  @Expose()
  crossSellProducts: ClientProductListItemDto[];
}
