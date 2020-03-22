import { getModelForClass, prop } from '@typegoose/typegoose';

export class ConfirmEmail {
  @prop({ index: true, required: true })
  expireDate: Date;

  @prop({ index: true, required: true })
  token: string;

  @prop({ required: true })
  customerId: number;


  static collectionName = 'confirm-email';
}

export const ConfirmEmailModel = getModelForClass(ConfirmEmail, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
