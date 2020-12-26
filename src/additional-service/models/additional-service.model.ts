import { getModelForClass, prop } from '@typegoose/typegoose';
import { MultilingualText } from '../../shared/models/multilingual-text.model';

export class AdditionalService {
  @prop()
  _id: number;

  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop({ _id: false })
  name: MultilingualText;

  @prop({ _id: false })
  clientName: MultilingualText;

  @prop()
  isEnabled: boolean;

  @prop()
  price: number;

  static collectionName: string = 'additional-service';
}


export const AdditionalServiceModel = getModelForClass(AdditionalService, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
