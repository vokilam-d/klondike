import { getModelForClass, prop } from '@typegoose/typegoose';
import { CurrencyCodeEnum } from '../../shared/enums/currency.enum';

export class Currency {
  @prop()
  _id: CurrencyCodeEnum;

  set id(id) { this._id = id; }
  get id() { return this._id; }

  @prop({ default: '' })
  label: string;

  @prop()
  exchangeRate: number;

  @prop()
  isDefault: boolean;

  updatedAt: Date;


  static collectionName = 'currency';
}

export const CurrencyModel = getModelForClass(Currency, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
