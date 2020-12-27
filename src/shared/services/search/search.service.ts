import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { IFilter, ISorting } from '../../dtos/shared-dtos/spf.dto';
import { autocompleteSettings, elasticAutocompleteType, elasticDateType, elasticKeywordFieldName, elasticTextType } from '../../constants';

enum ElasticQueryType {
  Range = 'range',
  Term = 'term',
  MatchPhrasePrefix = 'match_phrase_prefix',
  Match = 'match',
}

@Injectable()
export class SearchService {

  private client: Client;
  private logger = new Logger(SearchService.name);

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URI
    });

    this.client.on('response', (err, result) => {
      if (err) {
        delete result.meta.connection;
        console.dir({ 'on_type': 'response', err, result }, { depth: 10 });
      }
    });
  }

  async ensureCollection(collection: string, properties): Promise<any> {
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
          settings: autocompleteSettings
        }
      });
    } catch (ex) {
      this.logger.error(`Could not ensure collection "${collection}":`);
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

  async addDocuments(collection: string, documents: any[]): Promise<any> {
    if (documents.length === 0) {
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
                                 sortFilter: any,
                                 schema: any,
                                 fuzzy: boolean = false
  ): Promise<[T[], number]> {

    const getQueryTypeForField = (fieldName: string): ElasticQueryType => {
      const isNested = fieldName.includes('.');
      let queryType = ElasticQueryType.Match;

      if (!schema) { return queryType; }

      let fieldFromSchema;

      if (isNested) {
        fieldFromSchema = schema;
        fieldName.split('.').forEach((fieldNamePart, index, arr) => {
          fieldFromSchema = fieldFromSchema?.[fieldNamePart];

          const isLastPart = index === arr.length - 1;
          if (!isLastPart) { fieldFromSchema = fieldFromSchema?.properties }
        });

      } else {
        fieldFromSchema = schema[fieldName];
      }

      if (fieldFromSchema) {
        if (fieldFromSchema.type === elasticDateType.type) {
          queryType = ElasticQueryType.Range;
        } else if (fieldFromSchema.type !== elasticTextType.type && fieldFromSchema.type !== elasticAutocompleteType.type) {
          queryType = ElasticQueryType.Term;
        }
      }

      return queryType;
    };

    const boolQuery = {
      must: []
    }

    filters.forEach(filter => {
      const filterQuery = {
        bool: {
          should: [],
          minimum_should_match: 1
        }
      }

      filter.values.forEach((value, valueIdx, valuesArr) => {
        if (value === undefined || value === '') { return; }

        const mustQuery = {
          bool: {
            should: [],
            minimum_should_match: 1
          }
        };

        const fieldNames = filter.fieldName.split('|');
        fieldNames.forEach(fieldName => {
          let valueForField;
          let shouldQuery: any = {};
          const queryType = getQueryTypeForField(fieldName);

          if (queryType === ElasticQueryType.Range) {
            valueForField = {
              'time_zone': '-03:00', // todo rm timezone hardcode
              ...(valuesArr[0] ? { 'gte': valuesArr[0] }: { }),
              ...(valuesArr[1] ? { 'lte': valuesArr[1] }: { })
            }
          } else if (queryType === ElasticQueryType.Match) {
            valueForField = {
              query : decodeURIComponent(value),
              operator: 'and'
            };

            if (fuzzy) {
              valueForField.fuzziness = 'auto';
            }
          } else {
            valueForField = decodeURIComponent(value);
          }

          const fieldNameParts = fieldName.split('.');
          for (let i = fieldNameParts.length - 1; i >= 0; i--) {
            const isLast = i === fieldNameParts.length - 1;

            if (isLast) {
              shouldQuery = {
                [queryType]: {
                  [fieldName]: valueForField
                }
              };

            } else {
              shouldQuery = {
                nested: {
                  path: fieldNameParts.filter((_, k) => k <= i).join('.'),
                  query: shouldQuery
                }
              };
            }
          }

          mustQuery.bool.should.push(shouldQuery);

        });

        filterQuery.bool.should.push(mustQuery);
      });

      boolQuery.must.push(filterQuery);
    });

    return await this.searchByQuery(collection, boolQuery, from, size, sortObj, sortFilter, schema);
  }

  public async searchByQuery<T = any>(collection: string,
                                      boolQuery: any,
                                      from: number,
                                      size: number,
                                      sortObj: ISorting = {},
                                      sortFilter?: any,
                                      schema?: any
  ): Promise<[T[], number]> {

    const sort = [];
    let nestedSortArr = [];
    const getSortFieldForFieldName = (fieldName: string, isNested: boolean): string => {
      let sortField = fieldName;

      if (!schema || sortField === '_script') { return sortField; }

      let fieldFromSchema;

      if (isNested) {
        fieldFromSchema = schema;
        fieldName.split('.').forEach((fieldNamePart, index, arr) => {
          fieldFromSchema = fieldFromSchema?.[fieldNamePart];

          const isLastPart = index === arr.length - 1;
          if (!isLastPart) { fieldFromSchema = fieldFromSchema?.properties }
        });

      } else {
        fieldFromSchema = schema[fieldName];

        if (!fieldFromSchema && fieldName === '_id') {
          sortField = 'id';
          fieldFromSchema = schema[sortField];
        }
      }

      if (fieldFromSchema.fields?.[elasticKeywordFieldName]) {
        sortField += `.${elasticKeywordFieldName}`;
      }

      return sortField;
    };

    Object.entries(sortObj).forEach(entry => {
      const [fieldName, value] = entry;
      const sortField = getSortFieldForFieldName(fieldName, fieldName.includes('.'));

      if (typeof value === 'object') {
        nestedSortArr.push({ [sortField]: value });
        return;
      }

      if (fieldName.includes('.')) {
        const [parentField] = fieldName.split('.');
        const nestedSort: any = {
          [sortField]: {
            nested: {
              path: parentField,
              ...(sortFilter ? { filter: { term: sortFilter } } : {})
            }
          }
        };

        if (typeof value === 'string') {
          nestedSort[sortField].order = value;
        }

        nestedSortArr.push(nestedSort);

      } else {
        sort.push(`${sortField}:${value}`);
      }
    });

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
          ...(nestedSortArr.length ? { sort: nestedSortArr } : {})
        }
      });

      const hitsSource = body.hits.hits.map(hit => hit._source);
      const itemsFiltered = body.hits.total.value;
      return [hitsSource, itemsFiltered];
    } catch (ex) {
      this.logger.error('Could not search by filters:');
      this.logger.error(ex.meta ? ex.meta.body : ex);
      throw new InternalServerErrorException(ex.meta?.body.failed_shards?.map(shard => shard?.reason.caused_by));
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
