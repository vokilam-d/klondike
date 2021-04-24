import { prop } from '@typegoose/typegoose';
import { PaymentTypeEnum } from '../../shared/enums/payment-type.enum';
import { MultilingualText } from '../../shared/models/multilingual-text.model';

export class OrderPaymentInfo {
  @prop()
  methodId: string;

  @prop()
  type: PaymentTypeEnum;

  @prop({ _id: false })
  methodClientName: MultilingualText;

  @prop({ _id: false })
  methodAdminName: MultilingualText;
}
