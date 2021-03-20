import { arrayProp, getModelForClass } from '@typegoose/typegoose';
import { BannerItem } from './banner-item.model';


export class Banner {
  @arrayProp({ items: BannerItem, _id: false })
  bannerItems: BannerItem[];

  static collectionName: string = 'banner';
}

export const BannerModel = getModelForClass(Banner, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
});
