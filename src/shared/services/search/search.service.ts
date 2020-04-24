import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { IFilter, ISorting } from '../../dtos/shared-dtos/spf.dto';

@Injectable()
export class SearchService {

  private client: Client;
  private logger = new Logger(SearchService.name);

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URI
    });

    // this.client.on('response', (err, result) => {
    //   if (err) {
    //     delete result.meta.connection;
    //     console.dir({ 'on_type': 'response', err, result }, { depth: 10 });
    //   }
    // });
  }

  async ensureCollection(collection: string, properties, customSettings?): Promise<any> {
    try {
      const { body: exists } = await this.client.indices.exists({ index: collection });
      if (exists) {
        return;
      }

      await this.client.indices.create({
        index: collection,
        body: {
          mappings: {
            properties
          },
          settings: customSettings
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

  // TODO doc should implement hasId or something
  async addDocuments(collection: string, documents: any): Promise<any> {
    if (documents.length == 0) {
      return;
    }
    const body = documents.flatMap(doc => [{ index: { _index: collection, _id: doc.id } }, doc]);
    try {
      await this.client.bulk({ refresh: 'true', body });
    } catch (ex) {
      this.logger.error('Failed to submit document bulk:');
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
                                 sortObj: ISorting = {},
                                 sortFilter?: any
  ): Promise<[T[], number]> {

    const boolQuery = {
      must: [],
      should: []
    }

    filters.forEach(filter => {
      if (typeof filter.value === 'string' && filter.value.includes('|')) {

        filter.value.split('|').forEach(value => {
          boolQuery.should.push({
            term: {
              [filter.fieldName]: value
            }
          });
        });

      } else if (filter.fieldName.includes('.')) {
        const [parentField] = filter.fieldName.split('.');
        boolQuery.must.push({
          'nested': {
            path: parentField,
            query: {
              'match_phrase_prefix': {
                [filter.fieldName]: filter.value
              }
            }
          }
        });
      } else {
        boolQuery.must.push({
          multi_match: {
            query: filter.value,
            type: 'phrase_prefix',
            fields: filter.fieldName.split('|')
          }
        });
      }
    });

    return await this.searchByQuery(collection, boolQuery, from, size, sortObj, sortFilter);
  }

  public async searchByQuery<T = any>(collection: string,
                                      boolQuery: any,
                                      from: number,
                                      size: number,
                                      sortObj: ISorting = {},
                                      sortFilter?: any
  ): Promise<[T[], number]> {

    const sort = [];
    let nestedSort = [];
    Object.entries(sortObj).forEach(entry => {
      const [fieldName, value] = entry;

      if (fieldName.includes('.')) {
        const [parentField] = fieldName.split('.');
        nestedSort.push({
          [fieldName]: {
            order: value,
            nested: {
              path: parentField,
              ...(sortFilter ? { filter: { term: sortFilter } } : {})
            }
          }
        });

      } else {
        sort.push(`${fieldName}:${value}`);
      }
    });
    sort.push('id:desc');

    try {
      const { body } = await this.client.search({
        index: collection,
        from,
        size,
        sort,
        body: {
          query: {
            bool: boolQuery
          },
          ...(nestedSort.length ? { sort: nestedSort } : {})
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
      refresh: true,
      body: {
        query: queryTerm,
        script: {
          source: updateScript,
          lang: 'painless'
        }
      }
    });
  }
}
