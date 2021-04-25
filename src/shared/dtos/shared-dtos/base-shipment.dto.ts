import { IsInt, IsOptional, IsString } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { ShipmentStatusEnum } from '../../enums/shipment-status.enum';
import { ShipmentPayerEnum } from '../../enums/shipment-payer.enum';
import { TrimString } from '../../decorators/trim-string.decorator';
import { Shipment } from '../../../order/models/shipment.model';
import { ShipmentCounterpartyDto } from './shipment-counterparty.dto';

export abstract class BaseShipmentDto implements Shipment {

  @Expose()
  @IsOptional()
  @Transform(value => value ? value.replace(/\D/g, '') : value)
  trackingNumber: string;

  @Expose()
  @IsOptional()
  estimatedDeliveryDate: string;

  @Expose()
  @IsOptional()
  status: ShipmentStatusEnum;

  @Expose()
  @IsString()
  @IsOptional()
  @TrimString()
  statusDescription: string;

  @Expose()
  @Type(() => ShipmentCounterpartyDto)
  @IsOptional()
  sender: ShipmentCounterpartyDto;

  @Expose()
  @Type(() => ShipmentCounterpartyDto)
  @IsOptional()
  recipient: ShipmentCounterpartyDto;

  abstract shippingMethodDescription: any;

  @Expose()
  @IsOptional()
  payerType: ShipmentPayerEnum;

  @Expose()
  @IsOptional()
  weight: string;

  @Expose()
  @IsOptional()
  length: string;

  @Expose()
  @IsOptional()
  width: string;

  @Expose()
  @IsOptional()
  height: string;

  @Expose()
  @IsOptional()
  backwardMoneyDelivery: number;

  @Expose()
  @IsOptional()
  cost: number;

  @Expose()
  @IsOptional()
  description: string;

}
