import { AdminProductSelectedAttributeDto } from '../admin/product-selected-attribute.dto';
import { Expose } from 'class-transformer';

export class ClientProductSelectedAttributeDto extends AdminProductSelectedAttributeDto {
  @Expose()
  attributeName: string;
  @Expose()
  valueName: string;
}
