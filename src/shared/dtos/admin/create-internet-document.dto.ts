import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Shipment } from '../../../order/models/shipment.model';
import { ShipmentPayerEnum } from '../../enums/shipment-payer.enum';

export class CreateInternetDocumentDto implements Pick<Shipment, 'trackingNumber' | 'payerType' | 'weight' | 'length' | 'width' | 'height' | 'backwardMoneyDelivery' | 'cost' | 'description'> {
  @IsNumber()
  @IsOptional()
  senderId: number;

  @IsString()
  @IsOptional()
  trackingNumber: string;

  @IsNumber()
  @IsOptional()
  backwardMoneyDelivery: number;

  @IsNumber()
  @IsOptional()
  cost: number;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  height: string;

  @IsString()
  @IsOptional()
  length: string;

  @IsOptional()
  payerType: ShipmentPayerEnum;

  @IsString()
  @IsOptional()
  weight: string;

  @IsString()
  @IsOptional()
  width: string;
}
