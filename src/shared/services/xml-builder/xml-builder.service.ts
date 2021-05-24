import { Injectable } from '@nestjs/common';
import { create } from 'xmlbuilder2/lib';

@Injectable()
export class XmlBuilder {
  build(data: { [key: string]: any }, version: string = '1.0'): string {
    const doc = create({ version }).ele(data);

    const feed = doc.end({ prettyPrint: true, allowEmptyTags: true });
    return feed.toString();
  }
}
