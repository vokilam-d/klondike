import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { __ } from '../../shared/helpers/translate/translate.function';
import { plainToClass } from 'class-transformer';
import { CronProdPrimaryInstance } from '../../shared/decorators/primary-instance-cron.decorator';
import { InjectModel } from '@nestjs/mongoose';
import { Aggregator } from '../models/aggregator.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { getCronExpressionEarlyMorning } from '../../shared/helpers/get-cron-expression-early-morning.function';
import { SearchService } from '../../shared/services/search/search.service';
import { AdminSPFDto } from '../../shared/dtos/admin/spf.dto';
import { ElasticAggregator } from '../models/elastic-aggregator.model';
import { AdminAggregatorDto } from '../../shared/dtos/admin/aggregator.dto';
import { ClientAggregatedProductsTableDto } from '../../shared/dtos/client/aggregated-products-table.dto';
import { ProductService } from '../../product/services/product.service';
import { ClientProductSPFDto } from '../../shared/dtos/client/product-spf.dto';
import { IFilter } from '../../shared/dtos/shared-dtos/spf.dto';
import { AdminProductListItemDto } from '../../shared/dtos/admin/product-list-item.dto';
import { ClientAggregatedProductDto } from '../../shared/dtos/client/aggregated-product.dto';

@Injectable()
export class AggregatorService {

  private logger = new Logger(AggregatorService.name);

  constructor(@InjectModel(Aggregator.name) private readonly aggregatorModel: ReturnModelType<typeof Aggregator>,
              private readonly productService: ProductService,
              private readonly searchService: SearchService
  ) { }

  onApplicationBootstrap(): any {
    this.searchService.ensureCollection(Aggregator.collectionName, new ElasticAggregator());
  }

  async getAggregatorsResponseDto(spf: AdminSPFDto): Promise<ResponseDto<AdminAggregatorDto[]>> {
    let aggregators: AdminAggregatorDto[];
    let itemsFiltered: number;

    if (spf.hasFilters()) {
      const searchResponse = await this.searchByFilters(spf);
      aggregators = searchResponse[0];
      itemsFiltered = searchResponse[1];
    } else {
      aggregators = await this.aggregatorModel
        .find()
        .sort(spf.getSortAsObj())
        .skip(spf.skip)
        .limit(spf.limit)
        .exec();

      aggregators = plainToClass(AdminAggregatorDto, aggregators, { excludeExtraneousValues: true });
    }

    const itemsTotal = await this.countAggregators();
    const pagesTotal = Math.ceil((itemsFiltered ?? itemsTotal) / spf.limit);
    return {
      data: aggregators,
      itemsTotal,
      itemsFiltered,
      pagesTotal
    };
  }

  async getAllAggregators(): Promise<Aggregator[]> {
    const aggregators = await this.aggregatorModel.find().exec();
    return aggregators.map(aggregator => aggregator.toJSON());
  }

  async getAggregator(id: string): Promise<DocumentType<Aggregator>> {
    const found = await this.aggregatorModel.findById(id).exec();
    if (!found) {
      throw new NotFoundException(__('Aggregator with id "$1" not found', 'ru', id));
    }

    return found;
  }

  async createAggregator(aggregatorDto: AdminAggregatorDto): Promise<DocumentType<Aggregator>> {
    const found = await this.aggregatorModel.findById(aggregatorDto.id).exec();
    if (found) {
      throw new BadRequestException(__('Aggregator with id "$1" already exists', 'ru', aggregatorDto.id));
    }

    const aggregator = new this.aggregatorModel(aggregatorDto);
    await aggregator.save();
    this.addSearchData(aggregator);

    return aggregator;
  }

  async updateAggregator(aggregatorId: string, aggregatorDto: AdminAggregatorDto): Promise<DocumentType<Aggregator>> {
    const aggregator = await this.getAggregator(aggregatorId);

    Object.keys(aggregatorDto).forEach(key => aggregator[key] = aggregatorDto[key]);

    await aggregator.save();
    this.updateSearchData(aggregator);

    return aggregator;
  }

  async deleteAggregator(aggregatorId: string): Promise<DocumentType<Aggregator>> {
    const deleted = await this.aggregatorModel.findByIdAndDelete(aggregatorId).exec();
    if (!deleted) {
      throw new NotFoundException(__('Aggregator with id "$1" not found', 'ru', aggregatorId));
    }
    this.deleteSearchData(deleted);

    return deleted;
  }

  countAggregators(): Promise<number> {
    return this.aggregatorModel.estimatedDocumentCount().exec();
  }

  async getClientAggregators(productId: number): Promise<ClientAggregatedProductsTableDto[]> {
    const aggregators = await this.aggregatorModel.find({ productIds: productId }).exec();

    const spf = new ClientProductSPFDto();
    const isEnabledProp: keyof AdminProductListItemDto = 'isEnabled';
    const filters: IFilter[] = [
      { fieldName: isEnabledProp, values: [true] },
      { fieldName: 'id', values: aggregators.flatMap(aggregator => aggregator.productIds) }
    ];
    const [linkedProducts] = await this.productService.findByFilters(spf, filters)

    const tables: ClientAggregatedProductsTableDto[] = [];
    for (const aggregator of aggregators) {
      const aggregatedProducts: ClientAggregatedProductDto[] = [];

      for (const linkedProductId of aggregator.productIds) {
        const product = linkedProducts.find(product => product.id === linkedProductId);
        if (!product) { continue; }

        for (const variant of product.variants) {
          aggregatedProducts.push(variant);
        }
      }

      tables.push({
        name: aggregator.name,
        products: aggregatedProducts
      });
    }

    return tables;
  }

  private async addSearchData(aggregator: Aggregator) {
    const aggregatorDto = plainToClass(AdminAggregatorDto, aggregator, { excludeExtraneousValues: true });
    await this.searchService.addDocument(Aggregator.collectionName, aggregator.id, aggregatorDto);
  }

  private updateSearchData(aggregator: Aggregator): Promise<any> {
    const aggregatorDto = plainToClass(AdminAggregatorDto, aggregator, { excludeExtraneousValues: true });
    return this.searchService.updateDocument(Aggregator.collectionName, aggregator.id, aggregatorDto);
  }

  private deleteSearchData(aggregator: Aggregator): Promise<any> {
    return this.searchService.deleteDocument(Aggregator.collectionName, aggregator.id);
  }

  @CronProdPrimaryInstance(getCronExpressionEarlyMorning())
  private async reindexAllSearchData() {
    this.logger.log('Start reindex all search data');
    const aggregators = await this.aggregatorModel.find().exec();

    await this.searchService.deleteCollection(Aggregator.collectionName);
    await this.searchService.ensureCollection(Aggregator.collectionName, new ElasticAggregator());

    for (const batch of getBatches(aggregators, 20)) {
      await Promise.all(batch.map(aggregator => this.addSearchData(aggregator)));
      this.logger.log(`Reindexed ids: ${batch.map(i => i.id).join()}`);
    }

    function getBatches<T = any>(arr: T[], size: number = 2): T[][] {
      const result = [];
      for (let i = 0; i < arr.length; i++) {
        if (i % size !== 0) {
          continue;
        }

        const resultItem = [];
        for (let k = 0; (resultItem.length < size && arr[i + k]); k++) {
          resultItem.push(arr[i + k]);
        }
        result.push(resultItem);
      }

      return result;
    }
  }

  private async searchByFilters(spf: AdminSPFDto) {
    return this.searchService.searchByFilters<AdminAggregatorDto>(
      Aggregator.collectionName,
      spf.getNormalizedFilters(),
      spf.skip,
      spf.limit,
      spf.getSortAsObj(),
      undefined,
      new ElasticAggregator()
    );
  }
}
