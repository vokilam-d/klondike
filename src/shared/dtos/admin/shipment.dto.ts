import { IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class ShipmentDto {

  @Expose()
  @IsString()
  trackingNumber: string;

  @Expose()
  @IsOptional()
  status?: any;

  @Expose()
  @IsString()
  @IsOptional()
  statusDescription?: string;

  @Expose()
  @IsString()
  @IsOptional()
  senderPhone: string = null;

}
