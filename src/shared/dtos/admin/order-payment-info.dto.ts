import { Expose, Type } from 'class-transformer';
import { OrderPaymentInfo } from '../../../order/models/order-payment-info.model';
import { PaymentTypeEnum } from '../../enums/payment-type.enum';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';

export class AdminOrderPaymentInfoDto implements OrderPaymentInfo {
  @Expose()
  @Type(() => MultilingualTextDto)
  methodAdminName: MultilingualTextDto;

  @Expose()
  @Type(() => MultilingualTextDto)
  methodClientName: MultilingualTextDto;

  @Expose()
  methodId: string;

  @Expose()
  type: PaymentTypeEnum;
}
