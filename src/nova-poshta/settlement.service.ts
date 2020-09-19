import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SearchService } from '../shared/services/search/search.service';
import { ElasticSettlement } from './models/elastic-settlement.model';
import { ClientSPFDto } from '../shared/dtos/client/spf.dto';
import { CronProdPrimaryInstance } from '../shared/decorators/primary-instance-cron.decorator';
import { SettlementDto } from '../shared/dtos/shared-dtos/settlement.dto';
import { plainToClass } from 'class-transformer';

import { NovaPoshtaService } from './nova-poshta.service';
import { getCronExpressionEarlyMorning } from '../shared/helpers/get-cron-expression-early-morning.function';

@Injectable()
export class SettlementService implements OnApplicationBootstrap {

  private logger = new Logger(SettlementService.name);

  constructor(private readonly novaPoshtaService: NovaPoshtaService, private readonly searchService: SearchService) {
  }

  async onApplicationBootstrap() {
    this.searchService.ensureCollection(ElasticSettlement.collectionName, new ElasticSettlement());
  }

  public async getSettlements(spf: ClientSPFDto): Promise<SettlementDto[]> {
    const query = !spf.name ? { 'match_all': {} } :
      {
        'multi_match': {
          'query': spf.name,
          'type': 'phrase_prefix',
          'fields': [
            'name',
            'ruName'
          ]
        }
      };
    const searchResponse = await this.searchService.searchByQuery(ElasticSettlement.collectionName,
      { must: query },
      0,
      spf.limit,
      { priority: 'asc', fullName: 'asc' });
    return plainToClass(SettlementDto, searchResponse[0], { excludeExtraneousValues: true });
  }

  @CronProdPrimaryInstance(getCronExpressionEarlyMorning())
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
