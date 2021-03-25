import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { OrderItem } from './order-item.model';
import { OrderStatusEnum } from '../../shared/enums/order-status.enum';
import { Shipment } from './shipment.model';
import { PaymentTypeEnum } from '../../shared/enums/payment-type.enum';
import { getTranslations } from '../../shared/helpers/translate/translate.function';
import { Log } from '../../shared/models/log.model';
import { OrderPrices } from '../../shared/models/order-prices.model';
import { MultilingualText } from '../../shared/models/multilingual-text.model';
import { Manager } from './manager.model';
import { Media } from '../../shared/models/media.model';

export class Order {
  @prop()
  _id: number;

  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop()
  idForCustomer: string;

  @prop({ index: true })
  customerId: number;

  @prop()
  customerFirstName: string;

  @prop()
  customerLastName: string;

  @prop()
  customerMiddleName: string;

  @prop({ default: '' })
  customerEmail: string;

  @prop({ default: '' })
  customerPhoneNumber: string;

  @prop({ default: '' })
  customerNote: string;

  @prop()
  shouldSaveAddress: boolean;

  @prop({ default: new Date() })
  createdAt: Date;

  @prop({ default: new Date() })
  updatedAt: Date;

  @prop({ default: null })
  shippedAt: Date;

  @prop()
  paymentMethodId: string;

  @prop()
  paymentType: PaymentTypeEnum;

  @prop({ _id: false })
  paymentMethodClientName: MultilingualText;

  @prop({ _id: false })
  paymentMethodAdminName: MultilingualText;

  @prop({ _id: false })
  shippingMethodName: MultilingualText;

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
  clientNote: string;

  @prop()
  adminNote: string;

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
