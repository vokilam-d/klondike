import { CronExpression } from '@nestjs/schedule';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SearchService } from '../shared/services/search/search.service';
import { ElasticWarehouse } from './models/elastic-warehouse.model';
import { autocompleteSettings } from '../shared/constants';
import { ClientSPFDto } from '../shared/dtos/client/spf.dto';
import { ProdPrimaryInstanceCron } from '../shared/decorators/primary-instance-cron.decorator';
import { WarehouseDto } from '../shared/dtos/shared-dtos/warehouse.dto';
import { plainToClass } from 'class-transformer';
import { NovaPoshtaService } from './nova-poshta.service';

@Injectable()
export class WarehouseService implements OnApplicationBootstrap {

  private logger = new Logger(WarehouseService.name);

  constructor(private readonly novaPoshtaService: NovaPoshtaService, private readonly searchService: SearchService) {
  }

  async onApplicationBootstrap() {
    this.searchService.ensureCollection(ElasticWarehouse.collectionName, new ElasticWarehouse(), autocompleteSettings);
  }

  public async getWarehouses(spf: ClientSPFDto): Promise<WarehouseDto[]> {
    const queries: any[] = [
      {
        match: {
          settlementId: {
            query: spf.settlementId
          }
        }
      }
    ];
    if (spf.filter) {
      queries.push({
        multi_match: {
          fields: ['postOfficeNumber', 'address', 'addressRu'],
          query: spf.filter.toLowerCase(),
          type: 'phrase_prefix'
        }
      });
    }

    const boolQuery = { must: queries };
    const [ warehouses ] = await this.searchService.searchByQuery(ElasticWarehouse.collectionName, boolQuery, 0,
      spf.limit, {description : 'asc'});

    return plainToClass(WarehouseDto, warehouses, { excludeExtraneousValues: true });
  }

  @ProdPrimaryInstanceCron(CronExpression.EVERY_DAY_AT_4AM)
  public async loadWarehousesToElastic() {
    let warehouseCount = 0;
    try {
      let pageNumber = 0;
      let warehouses = [];
      do {
        pageNumber++;
        warehouses = await this.novaPoshtaService.fetchWarehouseCatalogPage(pageNumber);
        this.searchService.addDocuments(ElasticWarehouse.collectionName, warehouses).then();
        warehouseCount += warehouses.length;
      } while (warehouses.length !== 0);

    } catch (ex) {
      this.logger.error('Failed to fetch warehouses');
      throw ex;
    }

    this.logger.log(`Sent ${warehouseCount} warehouses to index`);
  }

}
