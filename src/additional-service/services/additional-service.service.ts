import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { __ } from '../../shared/helpers/translate/translate.function';
import { plainToClass } from 'class-transformer';
import { CronProdPrimaryInstance } from '../../shared/decorators/primary-instance-cron.decorator';
import { InjectModel } from '@nestjs/mongoose';
import { AdditionalService } from '../models/additional-service.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { getCronExpressionEarlyMorning } from '../../shared/helpers/get-cron-expression-early-morning.function';
import { SearchService } from '../../shared/services/search/search.service';
import { AdminSPFDto } from '../../shared/dtos/admin/spf.dto';
import { ElasticAdditionalService } from '../models/elastic-additional-service.model';
import { AdminAdditionalServiceDto } from '../../shared/dtos/admin/additional-service.dto';
import { ProductService } from '../../product/services/product.service';
import { CounterService } from '../../shared/services/counter/counter.service';

@Injectable()
export class AdditionalServiceService {

  private logger = new Logger(AdditionalServiceService.name);

  constructor(@InjectModel(AdditionalService.name) private readonly additionalServiceModel: ReturnModelType<typeof AdditionalService>,
              private readonly productService: ProductService,
              private readonly counterService: CounterService,
              private readonly searchService: SearchService
  ) { }

  onApplicationBootstrap(): any {
    this.searchService.ensureCollection(AdditionalService.collectionName, new ElasticAdditionalService());
    // this.reindexAllSearchData();
  }

  async getAdditionalServicesResponseDto(spf: AdminSPFDto): Promise<ResponseDto<AdminAdditionalServiceDto[]>> {
    let additionalServices: AdminAdditionalServiceDto[];
    let itemsFiltered: number;

    if (spf.hasFilters()) {
      const searchResponse = await this.searchByFilters(spf);
      additionalServices = searchResponse[0];
      itemsFiltered = searchResponse[1];
    } else {
      additionalServices = await this.additionalServiceModel
        .find()
        .sort(spf.getSortAsObj())
        .skip(spf.skip)
        .limit(spf.limit)
        .exec();

      additionalServices = plainToClass(AdminAdditionalServiceDto, additionalServices, { excludeExtraneousValues: true });
    }

    const itemsTotal = await this.countAdditionalServices();
    const pagesTotal = Math.ceil((itemsFiltered ?? itemsTotal) / spf.limit);
    return {
      data: additionalServices,
      itemsTotal,
      itemsFiltered,
      pagesTotal
    };
  }

  async getAllAdditionalServices(): Promise<AdditionalService[]> {
    const additionalServices = await this.additionalServiceModel.find().exec();
    return additionalServices.map(additionalService => additionalService.toJSON());
  }

  async getAdditionalService(id: string): Promise<DocumentType<AdditionalService>> {
    const found = await this.additionalServiceModel.findById(id).exec();
    if (!found) {
      throw new NotFoundException(__('AdditionalService with id "$1" not found', 'ru', id));
    }

    return found;
  }

  async createAdditionalService(additionalServiceDto: AdminAdditionalServiceDto): Promise<DocumentType<AdditionalService>> {
    const found = await this.additionalServiceModel.findById(additionalServiceDto.id).exec();
    if (found) {
      throw new BadRequestException(__('AdditionalService with id "$1" already exists', 'ru', additionalServiceDto.id));
    }

    const session = await this.additionalServiceModel.db.startSession();
    session.startTransaction();

    try {
      const additionalService = new this.additionalServiceModel(additionalServiceDto);
      additionalService.id = await this.counterService.getCounter(AdditionalService.collectionName, session);
      await additionalService.save();
      await session.commitTransaction();

      this.addSearchData(additionalService).then();

      return additionalService;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async updateAdditionalService(additionalServiceId: string, additionalServiceDto: AdminAdditionalServiceDto): Promise<DocumentType<AdditionalService>> {
    const additionalService = await this.getAdditionalService(additionalServiceId);

    Object.keys(additionalServiceDto).forEach(key => additionalService[key] = additionalServiceDto[key]);

    await additionalService.save();
    this.updateSearchData(additionalService);

    return additionalService;
  }

  async deleteAdditionalService(additionalServiceId: string): Promise<DocumentType<AdditionalService>> {
    const deleted = await this.additionalServiceModel.findByIdAndDelete(additionalServiceId).exec();
    if (!deleted) {
      throw new NotFoundException(__('AdditionalService with id "$1" not found', 'ru', additionalServiceId));
    }
    this.deleteSearchData(deleted);

    return deleted;
  }

  countAdditionalServices(): Promise<number> {
    return this.additionalServiceModel.estimatedDocumentCount().exec();
  }

  private async addSearchData(additionalService: AdditionalService) {
    const additionalServiceDto = plainToClass(AdminAdditionalServiceDto, additionalService, { excludeExtraneousValues: true });
    await this.searchService.addDocument(AdditionalService.collectionName, additionalService.id, additionalServiceDto);
  }

  private updateSearchData(additionalService: AdditionalService): Promise<any> {
    const additionalServiceDto = plainToClass(AdminAdditionalServiceDto, additionalService, { excludeExtraneousValues: true });
    return this.searchService.updateDocument(AdditionalService.collectionName, additionalService.id, additionalServiceDto);
  }

  private deleteSearchData(additionalService: AdditionalService): Promise<any> {
    return this.searchService.deleteDocument(AdditionalService.collectionName, additionalService.id);
  }

  @CronProdPrimaryInstance(getCronExpressionEarlyMorning())
  private async reindexAllSearchData() {
    this.logger.log('Start reindex all search data');
    const additionalServices = await this.additionalServiceModel.find().exec();

    await this.searchService.deleteCollection(AdditionalService.collectionName);
    await this.searchService.ensureCollection(AdditionalService.collectionName, new ElasticAdditionalService());

    for (const batch of getBatches(additionalServices, 20)) {
      await Promise.all(batch.map(additionalService => this.addSearchData(additionalService)));
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
    return this.searchService.searchByFilters<AdminAdditionalServiceDto>(
      AdditionalService.collectionName,
      spf.getNormalizedFilters(),
      spf.skip,
      spf.limit,
      spf.getSortAsObj(),
      undefined,
      new ElasticAdditionalService()
    );
  }
}
