import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { OrderItem } from './order-item.model';
import { OrderStatusEnum } from '../../shared/enums/order-status.enum';
import { Shipment } from './shipment.model';
import { getTranslations } from '../../shared/helpers/translate/translate.function';
import { Log } from '../../shared/models/log.model';
import { OrderPrices } from '../../shared/models/order-prices.model';
import { MultilingualText } from '../../shared/models/multilingual-text.model';
import { Manager } from './manager.model';
import { Media } from '../../shared/models/media.model';
import { OrderContactInfo } from './order-contact-info.model';
import { OrderPaymentInfo } from './order-payment-info.model';
import { OrderNotes } from './order-notes.model';
import { addLeadingZeros } from '../../shared/helpers/add-leading-zeros.function';

// customerFirstName -> customerContactInfo.firstName
// customerLastName -> customerContactInfo.lastName
// customerEmail -> customerContactInfo.email
// customerPhoneNumber -> customerContactInfo.phoneNumber
// paymentMethodId -> paymentInfo.methodId
// paymentType -> paymentInfo.type
// paymentMethodClientName -> paymentInfo.methodClientName
// paymentMethodAdminName -> paymentInfo.methodAdminName
// shippingMethodName -> shipment.shippingMethodDescription
// clientNote -> notes.fromCustomer
// adminNote -> notes.fromAdmin
// customerNote -> notes.aboutCustomer
export class Order {
  @prop()
  _id: number;

  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  get idForCustomer(): string { return addLeadingZeros(this.id); }

  @prop({ index: true })
  customerId: number;

  @prop()
  customerContactInfo: OrderContactInfo;

  @prop({ default: new Date() })
  createdAt: Date;

  @prop({ default: new Date() })
  updatedAt: Date;

  @prop({ default: null })
  shippedAt: Date;

  @prop()
  paymentInfo: OrderPaymentInfo;

  @prop()
  isCallbackNeeded: boolean;

  @prop({ default: new Shipment(), _id: false })
  shipment: Shipment;

  @prop({ default: new Manager(), _id: false })
  manager: Manager;

  @arrayProp({ items: OrderItem })
  items: OrderItem[];

  @prop()
  status: OrderStatusEnum;

  get statusDescription(): MultilingualText { return getTranslations(this.status); }

  @prop()
  notes: OrderNotes;

  @arrayProp({ items: Log, default: [] })
  logs: Log[];

  @prop()
  prices: OrderPrices;

  @prop({ default: false })
  isOrderPaid: boolean;

  @prop()
  source: 'client' | 'manager';

  @arrayProp({ items: Media, default: [] })
  medias: Media[];


  static collectionName: string = 'order';
}

export const OrderModel = getModelForClass(Order, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
