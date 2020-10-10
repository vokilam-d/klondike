import { IsInt, IsOptional, IsString } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { ShipmentAddressDto } from '../shared-dtos/shipment-address.dto';
import { ShipmentStatusEnum } from '../../enums/shipment-status.enum';
import { ShipmentPayerEnum } from '../../enums/shipment-payer.enum';
import { ShipmentPaymentMethodEnum } from '../../enums/shipment-payment-method.enum';
import { TrimString } from '../../decorators/trim-string.decorator';

export class ShipmentDto {

  @Expose()
  @IsOptional()
  @Transform(value => value ? value.replace(/\D/g, '') : value)
  trackingNumber?: string;

  @Expose()
  @IsOptional()
  estimatedDeliveryDate?: string;

  @Expose()
  @IsOptional()
  status?: ShipmentStatusEnum;

  @Expose()
  @IsString()
  @IsOptional()
  @TrimString()
  statusDescription?: string;

  @Expose()
  @IsInt()
  @IsOptional()
  senderId?: number;

  @Expose()
  @Type(() => ShipmentAddressDto)
  @IsOptional()
  recipient?: ShipmentAddressDto;

  @Expose()
  @IsOptional()
  payerType?: ShipmentPayerEnum;

  @Expose()
  @IsOptional()
  paymentMethod?: ShipmentPaymentMethodEnum;

  @Expose()
  @IsOptional()
  date?: string;

  @Expose()
  @IsOptional()
  weight?: string;

  @Expose()
  @IsOptional()
  length?: string;

  @Expose()
  @IsOptional()
  width?: string;

  @Expose()
  @IsOptional()
  height?: string;

  @Expose()
  @IsOptional()
  backwardMoneyDelivery?: string;

  @Expose()
  @IsOptional()
  cost?: string;

  @Expose()
  @IsOptional()
  description?: string;

}
