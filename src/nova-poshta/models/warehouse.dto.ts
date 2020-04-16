import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class WarehouseDto {

  @Expose()
  @IsString()
  id: string;

  @Expose()
  @IsString()
  description: string;

  settlementId: string;

  postOfficeNumber: string;

  address: string;

  addressRu: string;

}
