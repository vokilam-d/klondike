import { CronExpression } from '@nestjs/schedule';
import { HttpService, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SearchService } from '../shared/services/search/search.service';
import { ElasticWarehouse } from './models/elastic-warehouse.model';
import { autocompleteSettings } from '../shared/constants';
import { ClientSPFDto } from '../shared/dtos/client/spf.dto';
import { PrimaryInstanceCron } from '../shared/decorators/primary-instance-cron.decorator';
import { WarehouseDto } from './models/warehouse.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class WarehouseService implements OnApplicationBootstrap {

  private logger = new Logger(WarehouseService.name);

  constructor(private readonly http: HttpService, private readonly searchService: SearchService) {
  }

  async onApplicationBootstrap() {
    this.searchService.ensureCollection(ElasticWarehouse.collectionName, new ElasticWarehouse(), autocompleteSettings);
  }

  public async getWarehouses(spf: ClientSPFDto): Promise<WarehouseDto[]> {
    //TODO move to search service
    const query : any[] = [
      {
        match: {
          settlementId: {
            query: spf['settlementId']
          }
        }
      }
    ];
    if (spf['filter']) {
      query.push({
        multi_match: {
          fields: ['postOfficeNumber', 'address', 'addressRu'],
          query: spf['filter'].toLowerCase(),
          type: 'phrase_prefix'
        }
      });
    }
    const searchResponse = await this.searchService.searchByQuery(ElasticWarehouse.collectionName, query, 0, spf.limit);
    return plainToClass(WarehouseDto, searchResponse[0], { excludeExtraneousValues: true })
      .sort((a, b) => a.description.localeCompare(b.description));
  }

  @PrimaryInstanceCron(CronExpression.EVERY_DAY_AT_4AM)
  public async loadWarehousesToElastic() {
    let warehouseCount = 0;
    try {
      let pageNumber = 0;
      let plainWarehouses = [];
      do {
        pageNumber++;
        plainWarehouses = await this.fetchWarehouseCatalogPage(pageNumber);
        const warehouses = plainWarehouses.map(warehouse => WarehouseService.toWarehouseDto(warehouse));
        this.searchService.addDocuments(ElasticWarehouse.collectionName, warehouses);
        warehouseCount += plainWarehouses.length;
      } while (plainWarehouses.length !== 0);

    } catch (ex) {
      this.logger.error('Failed to fetch warehouses');
      throw ex;
    }

    this.logger.log(`Sent ${warehouseCount} warehouses to index`);
  }

  private async fetchWarehouseCatalogPage(warehouseBulkNumber: number): Promise<any[]> {
    const response = await this.http.post('http://api.novaposhta.ua/v2.0/json/AddressGeneral/getWarehouses',
      {
        modelName: 'AddressGeneral',
        calledMethod: 'getWarehouses',
        methodProperties: {
          Page: warehouseBulkNumber,
          Limit: 500
        },
        apiKey: process.env.NOVA_POSHTA_API_KEY
      }).toPromise();

    return response.data.data;
  }

  private static toWarehouseDto(warehouse): WarehouseDto {

    return {
      id: warehouse.Ref,
      description: `№${warehouse.Number} (${this.getStreetWithHouse(warehouse)})`.replace(/\"/g, ''),
      settlementId: warehouse.SettlementRef,
      postOfficeNumber: warehouse.Number,
      address: this.getStreet(warehouse.ShortAddress),
      addressRu: this.getStreet(warehouse.ShortAddressRu)
    };
  }

  private static getStreetWithHouse(warehouse) {
    return warehouse.Description.substring(warehouse.Description.indexOf(':') + 1).trim();
  }

  private static getStreet(shortAddress): string {
    if (!shortAddress) {
      return '';
    }
    let result = shortAddress;
    const split = shortAddress.split(',');
    if (split.length > 1) {
      result = split[1];
    }
    return result.trim().toLowerCase();
  }
}
