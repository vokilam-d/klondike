import { Expose } from 'class-transformer';
import { BaseOrderItemAdditionalServiceDto } from '../shared-dtos/base-order-item-additional-service.dto';
import { OrderItemAdditionalService } from '../../../order/models/order-item-additional-service.model';
import { Language } from '../../enums/language.enum';

export class ClientOrderItemAdditionalServiceDto extends BaseOrderItemAdditionalServiceDto {
  @Expose()
  name: string;

  static transformToDto(orderItemAdditionalService: OrderItemAdditionalService, lang: Language): ClientOrderItemAdditionalServiceDto {
    return {
      id: orderItemAdditionalService.id,
      name: orderItemAdditionalService.name[lang],
      price: orderItemAdditionalService.price
    }
  }
}
