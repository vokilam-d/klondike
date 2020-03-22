import { getModelForClass, prop } from '@typegoose/typegoose';

export class ResetPassword {
  @prop({ index: true, required: true })
  expireDate: Date;

  @prop({ index: true, required: true })
  token: string;

  @prop({ required: true })
  customerId: number;


  static collectionName = 'reset-password';
}

export const ResetPasswordModel = getModelForClass(ResetPassword, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
