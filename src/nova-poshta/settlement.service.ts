import { CronExpression } from '@nestjs/schedule';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SearchService } from '../shared/services/search/search.service';
import { ElasticSettlement } from './models/elastic-settlement.model';
import { autocompleteSettings } from '../shared/constants';
import { ClientSPFDto } from '../shared/dtos/client/spf.dto';
import { IFilter } from '../shared/dtos/shared-dtos/spf.dto';
import { ProdPrimaryInstanceCron } from '../shared/decorators/primary-instance-cron.decorator';
import { SettlementDto } from './models/settlement.dto';
import { plainToClass } from 'class-transformer';

import { NovaPoshtaService } from './nova-poshta.service';

@Injectable()
export class SettlementService implements OnApplicationBootstrap {

  private logger = new Logger(SettlementService.name);

  constructor(private readonly novaPoshtaService: NovaPoshtaService, private readonly searchService: SearchService) {
  }

  async onApplicationBootstrap() {
    this.searchService.ensureCollection(ElasticSettlement.collectionName, new ElasticSettlement(), autocompleteSettings);
  }

  public async getSettlements(spf: ClientSPFDto) : Promise<SettlementDto[]> {
    const filters: IFilter[] = [{ fieldName: 'name|ruName', value: spf.filter }];
    const searchResponse = await this.searchService.searchByFilters(ElasticSettlement.collectionName, filters, 0, spf.limit);
    return plainToClass(SettlementDto, searchResponse[0],{ excludeExtraneousValues: true })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  @ProdPrimaryInstanceCron(CronExpression.EVERY_DAY_AT_3AM)
  public async loadSettlementsToElastic() {
    let settlementCount = 0;
    try {
      let pageNumber = 0;
      let settlements = [];
      do {
        pageNumber++;
        settlements = await this.novaPoshtaService.fetchSettlementCatalogPage(pageNumber);
        this.searchService.addDocuments(ElasticSettlement.collectionName, settlements);
        settlementCount += settlements.length;
      } while (settlements.length !== 0);

    } catch (ex) {
      this.logger.error('Failed to fetch settlements');
      throw ex;
    }

    this.logger.log(`Sent ${settlementCount} settlements to index`);
  }

}
