import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { IFilter, ISorting } from '../dtos/shared-dtos/spf.dto';

@Injectable()
export class SearchService {

  private client: Client;
  private logger = new Logger(SearchService.name);

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URI
    });

    // this.client.on('response', (err, result) => {
    //   if (err) { }
    //   delete result.meta.connection;
    //   console.dir({ 'on_type': 'response', err, result }, { depth: 10 });
    // });
  }

  async ensureCollection(collection: string, properties): Promise<any> {
    try {
      const { body: exists } = await this.client.indices.exists({ index: collection });
      if (exists) { return; }

      await this.client.indices.create({
        index: collection,
        body: {
          mappings: {
            properties
          }
        }
      });
    } catch (ex) {
      this.logger.error('Could not ensure collection:');
      this.logger.error(ex.meta ? ex.meta.body : ex);
    }
  }

  async addDocument(collection: string, entityId: any, document: any): Promise<any> {
    // console.log({ m: 'addDocument', collection, entityId, document  });

    try {
      await this.client.index({
        id: entityId,
        index: collection,
        refresh: 'true',
        body: document
      });
    } catch (ex) {
      this.logger.error('Could not create document:');
      this.logger.error(ex.meta ? ex.meta.body : ex);
    }
  }

  async updateDocument(collection: string, entityId: any, document: any): Promise<any> {
    // console.log({ m: 'updateDocument', collection, entityId, document });

    try {
      await this.client.update({
        id: entityId,
        index: collection,
        refresh: 'true',
        body: {
          doc: document
        }
      });
    } catch (ex) {
      if (ex.meta && ex.meta.statusCode === 404) {
        await this.addDocument(collection, entityId, document);
      } else {
        this.logger.error('Could not update document:');
        this.logger.error(ex.meta ? ex.meta.body : ex);
      }
    }
  }

  async deleteDocument(collection: string, entityId: any): Promise<any> {
    // console.log({ m: 'deleteDocument', collection, entityId });

    try {
      await this.client.delete({
        id: entityId,
        index: collection
      });
    } catch (ex) {
      this.logger.error('Could not delete document:');
      this.logger.error(ex.meta ? ex.meta.body : ex);
    }
  }

  async deleteCollection(collection: string): Promise<any> {
    try {
      await this.client.indices.delete({
        index: collection
      });
    } catch (ex) {
      this.logger.error('Could not delete collection:');
      this.logger.error(ex.meta ? ex.meta.body : ex);
    }
  }

  async searchByFilters<T = any>(collection: string,
                                 filters: IFilter[],
                                 from: number,
                                 size: number,
                                 sortObj: ISorting = { }
  ): Promise<[T[], number]> {

    // console.log({ m: 'searchByFilters', collection, filters, from, size, sortObj });

    // build queries
    const queries = filters.map(filter => {
      const fields = [];
      filter.fieldName.split('|').forEach(fieldName => {
        fields.push(...[
          fieldName,
          `${fieldName}._2gram`,
          `${fieldName}._3gram`
        ]);
      });

      return {
        multi_match: {
          query: filter.value,
          // type: "bool_prefix",
          type: "phrase_prefix",
          fields
        }
      };

      // return {
      //   match_phrase_prefix: {
      //     [filter.fieldName]: filter.value
      //   }
      // }
    });

    // build sort
    const sort = [];
    Object.entries(sortObj).forEach(entry => {
      const [ fieldName, value ] = entry;

      sort.push(`${fieldName}:${value}`);
    });

    try {
      const { body } = await this.client.search({
        index: collection,
        from,
        size,
        sort,
        body: {
          query: {
            bool: {
              must: queries
            }
          }
        }
      });

      const hitsSource = body.hits.hits.map(hit => hit._source);
      const itemsFiltered = body.hits.total.value;
      return [hitsSource, itemsFiltered];
    } catch (ex) {
      this.logger.error('Could not search by filters:');
      this.logger.error(ex.meta ? ex.meta.body : ex);
      throw new Error();
    }
  }

  updateByQuery(collection: string, queryTerm: any, updateScript: string) {
    return this.client.update_by_query({
      index: collection,
      body: {
        query: {
          term: queryTerm
        },
        script: {
          source: updateScript,
          lang: 'painless'
        }
      }
    });
  }
}
