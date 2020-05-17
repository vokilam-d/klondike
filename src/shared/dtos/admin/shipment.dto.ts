import { IsOptional, IsString } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ShipmentParticipantDto } from './shipment-participant.dto';

export class ShipmentDto {

  @Expose()
  @IsOptional()
  trackingNumber?: string;

  @Expose()
  @IsOptional()
  estimatedDeliveryDate?: string;

  @Expose()
  @IsOptional()
  status?: any;

  @Expose()
  @IsString()
  @IsOptional()
  statusDescription?: string;

  @Expose()
  @Type(() => ShipmentParticipantDto)
  sender?: ShipmentParticipantDto;

  @Expose()
  @Type(() => ShipmentParticipantDto)
  recipient?: ShipmentParticipantDto;

  @Expose()
  @IsOptional()
  shipmentType?: any;

  @Expose()
  @IsOptional()
  payerType?: any;

  @Expose()
  @IsOptional()
  paymentMethod?: any;

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
  description?: string;

}
