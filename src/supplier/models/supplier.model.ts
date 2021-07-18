import { getModelForClass, prop } from '@typegoose/typegoose';


export class Supplier {
  @prop()
  _id: number;

  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop()
  name: string;

  static collectionName: string = 'supplier';
}


export const SupplierModel = getModelForClass(Supplier, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
