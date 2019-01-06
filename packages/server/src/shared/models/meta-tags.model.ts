import { prop } from 'typegoose';
import { IMetaTags } from '../../../../shared/models/meta-tags.interface';

export class MetaTags implements IMetaTags {

  @prop()
  title?: string;

  @prop()
  description?: string;

  @prop()
  keywords?: string;
}