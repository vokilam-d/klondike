import { CronExpression } from '@nestjs/schedule';
import { HttpService, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SearchService } from '../shared/search/search.service';
import { ElasticCity } from './models/elastic-city.model';
import { autocompleteSettings } from '../shared/constants';
import { ClientSPFDto } from '../shared/dtos/client/spf.dto';
import { IFilter } from '../shared/dtos/shared-dtos/spf.dto';
import { PrimaryInstanceCron } from '../shared/decorators/primary-instance-cron.decorator';

@Injectable()
export class CityService implements OnApplicationBootstrap {

  private logger = new Logger(CityService.name);

  constructor(private readonly http: HttpService, private readonly searchService: SearchService) {
  }

  async onApplicationBootstrap() {
    this.searchService.ensureCollection(ElasticCity.collectionName, new ElasticCity(), autocompleteSettings);
  }

  @PrimaryInstanceCron(CronExpression.EVERY_DAY_AT_3AM)
  async loadCitiesToElastic() {
    let cityCount = 0;
    try {
      let pageNumber = 0;
      let cities = [];
      do {
        pageNumber++;
        cities = await this.fetchCityCatalogPage(pageNumber);
        const esCities = cities.map(CityService.toCityDto);
        this.searchService.addDocuments(ElasticCity.collectionName, esCities);
        cityCount += cities.length;
      } while (cities.length !== 0);

    } catch (ex) {
      this.logger.error('Failed to fetch cities');
      throw ex;
    }

    this.logger.log(`Sent ${cityCount} cities to index`);
  }

  private async fetchCityCatalogPage(cityBulkNumber: number) {
    let response = await this.http.post('http://api.novaposhta.ua/v2.0/json/Address/searchSettlements/',
      {
        'modelName': 'AddressGeneral',
        'calledMethod': 'getSettlements',
        'methodProperties': {
          'Page': cityBulkNumber,
          'Warehouse': '1'
        },
        'apiKey': 'fc458ea324bd4fea1f1013dba44cdd03'
      }).toPromise();

    return response.data.data;
  }

  private static toCityDto(city) {
    const cityPrefix = city.SettlementTypeDescription
      .replace(/селище міського типу/, 'смт.')
      .replace(/село/, 'с.')
      .replace(/селище/, 'с.')
      .replace(/місто/, 'м.');
    const regionsDescription = city.RegionsDescription ? ', ' + city.RegionsDescription : '';
    return {
      'id': city.Ref,
      'name': city.Description,
      'ruName': city.DescriptionRu,
      'fullName': `${cityPrefix} ${city.Description} (${city.AreaDescription}${regionsDescription})`
    };
  }

  async getCities(spf: ClientSPFDto) {
    const filters: IFilter[] = [{ fieldName: 'name|ruName', value: spf['filter'] }];
    const searchResponse = await this.searchService.searchByFilters(ElasticCity.collectionName, filters, 0, spf.limit);
    return searchResponse[0]
      .map(esCity => ({ id: esCity.id, name: esCity.fullName }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

}
