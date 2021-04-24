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
import { CounterService } from '../../shared/services/counter/counter.service';
import { GetClientAdditionalServicesQueryDto } from '../../shared/dtos/client/get-client-additional-services-query.dto';
import { IFilter } from '../../shared/dtos/shared-dtos/spf.dto';
import { BaseShipmentDto } from '../../shared/dtos/shared-dtos/base-shipment.dto';
import { Language } from '../../shared/enums/language.enum';

@Injectable()
export class AdditionalServiceService {

  private logger = new Logger(AdditionalServiceService.name);

  constructor(@InjectModel(AdditionalService.name) private readonly additionalServiceModel: ReturnModelType<typeof AdditionalService>,
              private readonly counterService: CounterService,
              private readonly searchService: SearchService
  ) { }

  onApplicationBootstrap(): any {
    this.searchService.ensureCollection(AdditionalService.collectionName, new ElasticAdditionalService());
    // this.reindexAllSearchData();
  }

  async getAdditionalServicesResponseDto(spf: AdminSPFDto): Promise<ResponseDto<AdminAdditionalServiceDto[]>> {
    const [additionalServices, itemsFiltered] = await this.searchByFilters(spf);
    const itemsTotal = await this.countAdditionalServices();
    const pagesTotal = Math.ceil((itemsFiltered ?? itemsTotal) / spf.limit);

    return {
      data: additionalServices,
      itemsTotal,
      pagesTotal,
      ...(spf.hasFilters() ? { itemsFiltered } : { })
    };
  }

  async getAllAdditionalServices(): Promise<AdditionalService[]> {
    const additionalServices = await this.additionalServiceModel.find().exec();
    return additionalServices.map(additionalService => additionalService.toJSON());
  }

  async getAdditionalServicesForClient(queryDto: GetClientAdditionalServicesQueryDto): Promise<AdminAdditionalServiceDto[]> {
    const spf = new AdminSPFDto();
    const idProp: keyof AdminAdditionalServiceDto = 'id';
    const isEnabledProp: keyof AdminAdditionalServiceDto = 'isEnabled';
    const filters: IFilter[] = [
      { fieldName: idProp, values: queryDto.idsAsArray() },
      { fieldName: isEnabledProp, values: [true] }
    ]

    const [additionalServices, itemsFiltered] = await this.searchByFilters(spf, filters)
    return additionalServices;
  }

  async getAdditionalServiceById(id: number, lang: Language): Promise<DocumentType<AdditionalService>> {
    const found = await this.additionalServiceModel.findById(id).exec();
    if (!found) {
      throw new NotFoundException(__('Additional service with id "$1" not found', lang, id));
    }

    return found;
  }

  async createAdditionalService(additionalServiceDto: AdminAdditionalServiceDto, lang: Language): Promise<DocumentType<AdditionalService>> {
    const found = await this.additionalServiceModel.findById(additionalServiceDto.id).exec();
    if (found) {
      throw new BadRequestException(__('Additional service with id "$1" already exists', lang, additionalServiceDto.id));
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

  async updateAdditionalService(
    additionalServiceId: string,
    additionalServiceDto: AdminAdditionalServiceDto,
    lang: Language
  ): Promise<DocumentType<AdditionalService>> {
    const additionalService = await this.getAdditionalServiceById(parseInt(additionalServiceId), lang);

    Object.keys(additionalServiceDto).forEach(key => additionalService[key] = additionalServiceDto[key]);

    await additionalService.save();
    this.updateSearchData(additionalService).then();

    return additionalService;
  }

  async deleteAdditionalService(additionalServiceId: string, lang): Promise<DocumentType<AdditionalService>> {
    const deleted = await this.additionalServiceModel.findByIdAndDelete(additionalServiceId).exec();
    if (!deleted) {
      throw new NotFoundException(__('Additional service with id "$1" not found', lang, additionalServiceId));
    }
    this.deleteSearchData(deleted).then();

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

  private async searchByFilters(spf: AdminSPFDto, filters?: IFilter[]) {
    return this.searchService.searchByFilters<AdminAdditionalServiceDto>(
      AdditionalService.collectionName,
      filters || spf.getNormalizedFilters(),
      spf.skip,
      spf.limit,
      spf.getSortAsObj(),
      undefined,
      new ElasticAdditionalService()
    );
  }

  @CronProdPrimaryInstance(getCronExpressionEarlyMorning())
  private async reindexAllSearchData() {
    this.logger.log('Start reindex all search data');
    const additionalServices = await this.additionalServiceModel.find().exec();
    const dtos = additionalServices.map(service => plainToClass(AdminAdditionalServiceDto, service, { excludeExtraneousValues: true }));

    await this.searchService.deleteCollection(AdditionalService.collectionName);
    await this.searchService.ensureCollection(AdditionalService.collectionName, new ElasticAdditionalService());
    await this.searchService.addDocuments(AdditionalService.collectionName, dtos);
    this.logger.log('Reindexed');
  }
}
