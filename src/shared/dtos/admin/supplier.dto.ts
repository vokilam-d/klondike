import { Expose } from 'class-transformer';
import { Supplier } from '../../../supplier/models/supplier.model';
import { IsString } from 'class-validator';

export class AdminSupplierDto implements Omit<Supplier, '_id'> {
  @Expose()
  id: number;

  @Expose()
  @IsString()
  name: string;
}
