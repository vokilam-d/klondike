import { CronExpression } from '@nestjs/schedule';
import { HttpService, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SearchService } from '../shared/services/search/search.service';
import { ElasticSettlement } from './models/elastic-settlement.model';
import { autocompleteSettings } from '../shared/constants';
import { ClientSPFDto } from '../shared/dtos/client/spf.dto';
import { IFilter } from '../shared/dtos/shared-dtos/spf.dto';
import { PrimaryInstanceCron } from '../shared/decorators/primary-instance-cron.decorator';
import { SettlementDto } from './models/settlement.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class SettlementService implements OnApplicationBootstrap {

  private logger = new Logger(SettlementService.name);

  constructor(private readonly http: HttpService, private readonly searchService: SearchService) {
  }

  async onApplicationBootstrap() {
    this.searchService.ensureCollection(ElasticSettlement.collectionName, new ElasticSettlement(), autocompleteSettings);
  }

  public async getSettlements(spf: ClientSPFDto) : Promise<SettlementDto[]> {
    const filters: IFilter[] = [{ fieldName: 'name|ruName', value: spf['filter'] }];
    const searchResponse = await this.searchService.searchByFilters(ElasticSettlement.collectionName, filters, 0, spf.limit);
    return plainToClass(SettlementDto, searchResponse[0],{ excludeExtraneousValues: true })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  @PrimaryInstanceCron(CronExpression.EVERY_DAY_AT_3AM)
  public async loadSettlementsToElastic() {
    let settlementCount = 0;
    try {
      let pageNumber = 0;
      let plainSettlements = [];
      do {
        pageNumber++;
        plainSettlements = await this.fetchSettlementCatalogPage(pageNumber);
        const settlements = plainSettlements.map(settlement => SettlementService.toSettlementDto(settlement));
        this.searchService.addDocuments(ElasticSettlement.collectionName, settlements);
        settlementCount += plainSettlements.length;
      } while (plainSettlements.length !== 0);

    } catch (ex) {
      this.logger.error('Failed to fetch settlements');
      throw ex;
    }

    this.logger.log(`Sent ${settlementCount} settlements to index`);
  }

  private async fetchSettlementCatalogPage(settlementBulkNumber: number) : Promise<any[]> {
    const response = await this.http.post('http://api.novaposhta.ua/v2.0/json/Address/searchSettlements/',
      {
        modelName: 'AddressGeneral',
        calledMethod: 'getSettlements',
        methodProperties: {
          Page: settlementBulkNumber,
          Warehouse: '1'
        },
        apiKey: process.env.NOVA_POSHTA_API_KEY
      }).toPromise();

    return response.data.data;
  }

  private static toSettlementDto(settlement): SettlementDto {
    const shortSettlementType = this.shortenSettlementType(settlement.SettlementTypeDescription);
    let fullName = `${shortSettlementType} ${settlement.Description} (${settlement.AreaDescription}`;
    if (settlement.RegionsDescription) {
      fullName += ', ' + settlement.RegionsDescription
    }
    fullName += ')';

    return {
      id: settlement.Ref,
      name: settlement.Description,
      ruName: settlement.DescriptionRu,
      fullName: fullName
    };
  }

  private static shortenSettlementType(settlementType: string): string {
    if (settlementType.includes('селище міського типу')) {
      return 'смт.'
    } else if (settlementType.includes('село') || settlementType.includes('селище')) {
      return 'с.'
    } else if (settlementType.includes('місто')) {
      return 'м.'
    }
    return '';
  }

}
