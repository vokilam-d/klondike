import { getModelForClass, prop } from '@typegoose/typegoose';


export class Announcement {
  @prop()
  isEnabled: boolean;

  @prop()
  announcement: string;

  static collectionName: string = 'announcement';
}


export const AnnouncementModel = getModelForClass(Announcement, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
