import { Injectable } from '@nestjs/common';
import { create, convert } from 'xmlbuilder2/lib';
import { XMLWriterOptions } from 'xmlbuilder2/lib/interfaces';

type obj = { [key: string]: any };

@Injectable()
export class XmlBuilder {

  buildDocument(data: obj, options: { prettyPrint?: boolean, headless?: boolean } = { }): string {
    if (typeof options.prettyPrint === 'undefined') {
      options.prettyPrint = true;
    }
    if (typeof options.headless === 'undefined') {
      options.headless = false;
    }

    const doc = create({ version: '1.0' }).ele(data);

    const feed = doc.end({ prettyPrint: options.prettyPrint, allowEmptyTags: true, headless: options.headless });
    return feed.toString();
  }

  buildElement(element: obj): string {
    const doc = create({ version: '1.0' }).ele({ element });
    const options: XMLWriterOptions = { prettyPrint: false, allowEmptyTags: true, headless: true };

    // return content without root "element" node
    return doc.reduce((value, node) => value + node.toString(options), '');
  }

  convertToObject(xmlString: string): obj {
    return convert(xmlString, { format: 'object' }) as obj;
  }
}
