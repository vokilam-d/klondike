import { Expose } from 'class-transformer';

export class WarehouseDto {

  @Expose()
  id: string;

  @Expose()
  description: string;

  settlementId: string;

  @Expose()
  postOfficeNumber: string;

  address: string;

  addressRu: string;

}
