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
import { AdminProductService } from '../../product/services/admin-product.service';
import { ClientProductSPFDto } from '../../shared/dtos/client/product-spf.dto';
import { IFilter } from '../../shared/dtos/shared-dtos/spf.dto';
import { AdminProductListItemDto } from '../../shared/dtos/admin/product-list-item.dto';
import { ClientAggregatedProductDto } from '../../shared/dtos/client/aggregated-product.dto';
import { CounterService } from '../../shared/services/counter/counter.service';
import { Language } from '../../shared/enums/language.enum';
import { BaseShipmentDto } from '../../shared/dtos/shared-dtos/base-shipment.dto';

@Injectable()
export class AggregatorService {

  private logger = new Logger(AggregatorService.name);

  constructor(@InjectModel(Aggregator.name) private readonly aggregatorModel: ReturnModelType<typeof Aggregator>,
              private readonly productService: AdminProductService,
              private readonly counterService: CounterService,
              private readonly searchService: SearchService
  ) { }

  onApplicationBootstrap(): any {
    this.searchService.ensureCollection(Aggregator.collectionName, new ElasticAggregator());
    // this.reindexAllSearchData();
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

  async getAggregator(id: string, lang: Language): Promise<DocumentType<Aggregator>> {
    const found = await this.aggregatorModel.findById(id).exec();
    if (!found) {
      throw new NotFoundException(__('Aggregator with id "$1" not found', lang, id));
    }

    return found;
  }

  async createAggregator(aggregatorDto: AdminAggregatorDto, lang: Language): Promise<DocumentType<Aggregator>> {
    const found = await this.aggregatorModel.findById(aggregatorDto.id).exec();
    if (found) {
      throw new BadRequestException(__('Aggregator with id "$1" already exists', lang, aggregatorDto.id));
    }

    const session = await this.aggregatorModel.db.startSession();
    session.startTransaction();

    try {
      const aggregator = new this.aggregatorModel(aggregatorDto);
      aggregator.id = await this.counterService.getCounter(Aggregator.collectionName, session);
      await aggregator.save();
      await session.commitTransaction();

      this.addSearchData(aggregator).then();

      return aggregator;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async updateAggregator(aggregatorId: string, aggregatorDto: AdminAggregatorDto, lang: Language): Promise<DocumentType<Aggregator>> {
    const aggregator = await this.getAggregator(aggregatorId, lang);

    Object.keys(aggregatorDto).forEach(key => aggregator[key] = aggregatorDto[key]);

    await aggregator.save();
    this.updateSearchData(aggregator);

    return aggregator;
  }

  async deleteAggregator(aggregatorId: string, lang: Language): Promise<DocumentType<Aggregator>> {
    const deleted = await this.aggregatorModel.findByIdAndDelete(aggregatorId).exec();
    if (!deleted) {
      throw new NotFoundException(__('Aggregator with id "$1" not found', lang, aggregatorId));
    }
    this.deleteSearchData(deleted);

    return deleted;
  }

  countAggregators(): Promise<number> {
    return this.aggregatorModel.estimatedDocumentCount().exec();
  }

  async getClientAggregators(productId: number, lang: Language): Promise<ClientAggregatedProductsTableDto[]> {
    const aggregators = await this.aggregatorModel.find({ productIds: productId }).exec();
    const productIds = aggregators.flatMap(aggregator => aggregator.productIds);

    const spf = new ClientProductSPFDto();
    spf.limit = productIds.length;
    const isEnabledProp: keyof AdminProductListItemDto = 'isEnabled';
    const filters: IFilter[] = [
      { fieldName: isEnabledProp, values: [true] },
      { fieldName: 'id', values: productIds }
    ];
    const [linkedProducts] = await this.productService.findByFilters(spf, filters)

    const tables: ClientAggregatedProductsTableDto[] = [];
    for (const aggregator of aggregators) {
      const aggregatedProducts: ClientAggregatedProductDto[] = [];

      for (const linkedProductId of aggregator.productIds) {
        const product = linkedProducts.find(product => product.id === linkedProductId);
        if (!product || product.id === productId) { continue; }

        for (const variant of product.variants) {
          aggregatedProducts.push({
            ...variant,
            name: variant.name[lang],
            price: variant.priceInDefaultCurrency
          });
        }
      }

      tables.push({
        name: aggregator.clientName[lang],
        isInPriority: aggregator.isInPriority,
        products: aggregatedProducts
      });
    }

    tables.sort((a, b) => {
      if (a.isInPriority && b.isInPriority) {
        return 0
      } else if (a.isInPriority) {
        return -1;
      } else {
        return 1;
      }
    });

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
    const dtos = aggregators.map(aggregator => plainToClass(AdminAggregatorDto, aggregator, { excludeExtraneousValues: true }));

    await this.searchService.deleteCollection(Aggregator.collectionName);
    await this.searchService.ensureCollection(Aggregator.collectionName, new ElasticAggregator());
    await this.searchService.addDocuments(Aggregator.collectionName, dtos);
    this.logger.log(`Reindexed`);
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
