import { getModelForClass, prop } from '@typegoose/typegoose';
import { BotDataType } from '../enums/bot-data-type.enum';


export class BotData {
  @prop({ enum: BotDataType })
  type: BotDataType;

  @prop()
  data: any;

  static collectionName: string = 'bot';
}


export const BotDataModel = getModelForClass(BotData, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
