import { CronExpression } from '@nestjs/schedule';
import { HttpService, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SearchService } from '../shared/search/search.service';
import { ElasticCity } from './models/elastic-city.model';
import { autocompleteSettings } from '../shared/constants';
import { ClientSPFDto } from '../shared/dtos/client/spf.dto';
import { IFilter } from '../shared/dtos/shared-dtos/spf.dto';
import { PrimaryInstanceCron } from '../shared/decorators/primary-instance-cron.decorator';
import { CityDto } from './models/city.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class CityService implements OnApplicationBootstrap {

  private logger = new Logger(CityService.name);

  constructor(private readonly http: HttpService, private readonly searchService: SearchService) {
  }

  async onApplicationBootstrap() {
    this.searchService.ensureCollection(ElasticCity.collectionName, new ElasticCity(), autocompleteSettings);
  }

  public async getCities(spf: ClientSPFDto) : Promise<CityDto[]> {
    const filters: IFilter[] = [{ fieldName: 'name|ruName', value: spf['filter'] }];
    const searchResponse = await this.searchService.searchByFilters(ElasticCity.collectionName, filters, 0, spf.limit);
    return plainToClass(CityDto, searchResponse[0],{ excludeExtraneousValues: true })
      .sort((a, b) => a.name.localeCompare(b.name));
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
        const esCities = cities.map(c => CityService.toCityDto(c));
        this.searchService.addDocuments(ElasticCity.collectionName, esCities);
        cityCount += cities.length;
      } while (cities.length !== 0);

    } catch (ex) {
      this.logger.error('Failed to fetch cities');
      throw ex;
    }

    this.logger.log(`Sent ${cityCount} cities to index`);
  }

  private async fetchCityCatalogPage(cityBulkNumber: number) : Promise<any[]> {
    let response = await this.http.post('http://api.novaposhta.ua/v2.0/json/Address/searchSettlements/',
      {
        modelName: 'AddressGeneral',
        calledMethod: 'getSettlements',
        methodProperties: {
          Page: cityBulkNumber,
          Warehouse: '1'
        },
        apiKey: process.env.NOVA_POSHTA_API_KEY
      }).toPromise();

    return response.data.data;
  }

  private static toCityDto(city): CityDto {
    const shortCityType = this.shortenCityType(city.SettlementTypeDescription);
    let fullName = `${shortCityType} ${city.Description} (${city.AreaDescription}`;
    if (city.RegionsDescription) {
      fullName += ', ' + city.RegionsDescription
    }
    fullName += ')';

    return {
      id: city.Ref,
      name: city.Description,
      ruName: city.DescriptionRu,
      fullName: fullName
    };
  }

  private static shortenCityType(cityType: string): string {
    if (cityType.includes('селище міського типу')) {
      return 'смт.'
    } else if (cityType.includes('село') || cityType.includes('селище')) {
      return 'с.'
    } else if (cityType.includes('місто')) {
      return 'м.'
    }
    return '';
  }

}
