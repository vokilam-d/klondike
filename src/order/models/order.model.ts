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
import { CustomerContactInfo } from './customer-contact-info.model';
import { OrderPaymentInfo } from './order-payment-info.model';
import { OrderNotes } from './order-notes.model';
import { addLeadingZeros } from '../../shared/helpers/add-leading-zeros.function';

export class Order {
  @prop()
  _id: number;

  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  get idForCustomer(): string { return addLeadingZeros(this.id, 8); }

  @prop({ index: true })
  customerId: number;

  @prop({ _id: false, default: new CustomerContactInfo() })
  customerContactInfo: CustomerContactInfo;

  @prop({ default: new Date() })
  createdAt: Date;

  @prop({ default: new Date() })
  updatedAt: Date;

  @prop({ default: null })
  shippedAt: Date;

  @prop({ _id: false, default: new OrderPaymentInfo() })
  paymentInfo: OrderPaymentInfo;

  @prop()
  isCallbackNeeded: boolean;

  @prop({ default: new Shipment(), _id: false })
  shipment: Shipment;

  @prop({ default: new Manager(), _id: false })
  manager: Manager;

  @arrayProp({ items: OrderItem, _id: false, default: [] })
  items: OrderItem[];

  @prop()
  status: OrderStatusEnum;

  get statusDescription(): MultilingualText { return getTranslations(this.status); }

  @prop({ _id: false, default: new OrderNotes() })
  notes: OrderNotes;

  @arrayProp({ items: Log, default: [] })
  logs: Log[];

  @prop({ _id: false, default: new OrderPrices() })
  prices: OrderPrices;

  @prop({ default: false })
  isOrderPaid: boolean;

  @prop()
  source: 'client' | 'manager';

  @arrayProp({ items: Media, default: [], _id: false })
  medias: Media[];


  static collectionName: string = 'order';
}

export const OrderModel = getModelForClass(Order, {
  schemaOptions: {
    toJSON: {
      virtuals: true,
      getters: true
    },
    timestamps: true
  }
});
