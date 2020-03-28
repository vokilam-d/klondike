import { Expose, Transform } from 'class-transformer';

export class ClientShippingMethodDto {
  @Expose()
  @Transform(((value, obj) => value ? value : obj._id && obj._id.toString()))
  id: string;

  @Expose()
  @Transform(((value, obj) => value ? value : obj.clientName))
  name: string;

  @Expose()
  price: number;
}
