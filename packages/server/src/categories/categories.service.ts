import { Injectable } from '@nestjs/common';
import * as got from 'got';

@Injectable()
export class CategoriesService {
  async getTest() {
    try {
      const resp = await got(`https://swapi.co/api/planets?format=json`);
      return resp.body;
    } catch (ex) {
      console.error(ex);
    }
  }
}
