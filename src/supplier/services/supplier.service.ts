import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Supplier, SupplierModel } from '../models/supplier.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { AdminSupplierDto } from '../../shared/dtos/admin/supplier.dto';
import { CounterService } from '../../shared/services/counter/counter.service';
import { AdminSPFDto } from '../../shared/dtos/admin/spf.dto';
import { __ } from '../../shared/helpers/translate/translate.function';
import { Language } from '../../shared/enums/language.enum';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { IFilter } from '../../shared/dtos/shared-dtos/spf.dto';
import { CronProdPrimaryInstance } from '../../shared/decorators/primary-instance-cron.decorator';
import { getCronExpressionEarlyMorning } from '../../shared/helpers/get-cron-expression-early-morning.function';
import { ElasticSupplier } from '../models/elastic-supplier.model';
import { SearchService } from '../../shared/services/search/search.service';

@Injectable()
export class SupplierService implements OnApplicationBootstrap {

  private logger = new Logger(SupplierService.name);

  constructor(
    @InjectModel(Supplier.name) private readonly supplierModel: ReturnModelType<typeof SupplierModel>,
    private readonly counterService: CounterService,
    private readonly searchService: SearchService
  ) { }

  async onApplicationBootstrap() {
    this.searchService.ensureCollection(Supplier.collectionName, new ElasticSupplier()).then();
  }

  async getSuppliersResponseDto(spf: AdminSPFDto): Promise<ResponseDto<AdminSupplierDto[]>> {
    const [suppliers, itemsFiltered] = await this.searchByFilters(spf);
    const itemsTotal = await this.countSuppliers();
    const pagesTotal = Math.ceil((itemsFiltered ?? itemsTotal) / spf.limit);

    return {
      data: suppliers,
      itemsTotal,
      pagesTotal,
      ...(spf.hasFilters() ? { itemsFiltered } : { })
    };
  }

  async getSupplierById(id: number, lang: Language): Promise<DocumentType<Supplier>> {
    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) {
      throw new NotFoundException(__(`Supplier with id "$1" not found`, lang, id));
    }

    return supplier;
  }

  async createSupplier(supplierDto: AdminSupplierDto): Promise<DocumentType<Supplier>> {

    const session = await this.supplierModel.db.startSession();
    session.startTransaction();

    try {
      const supplier = new this.supplierModel(supplierDto);
      supplier.id = await this.counterService.getCounter(Supplier.collectionName, session);
      await supplier.save();
      await session.commitTransaction();

      this.addSearchData(supplier).then();

      return supplier;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async updateSupplier(id: number, supplierDto: AdminSupplierDto, lang: Language): Promise<DocumentType<Supplier>> {
    const supplier = await this.getSupplierById(id, lang);

    Object.keys(supplierDto).forEach(key => supplier[key] = supplierDto[key]);

    await supplier.save();
    this.updateSearchData(supplier).then();

    return supplier;
  }

  async deleteSupplier(id: number, lang: Language): Promise<Supplier> {
    const deleted = await this.supplierModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(__(`Supplier with id "$1" not found`, lang, id));
    }

    this.deleteSearchData(deleted).then();

    return deleted;
  }

  private async countSuppliers(): Promise<number> {
    return this.supplierModel.estimatedDocumentCount().exec();
  }

  private async addSearchData(supplier: Supplier) {
    const supplierDto = plainToClass(AdminSupplierDto, supplier, { excludeExtraneousValues: true });
    await this.searchService.addDocument(Supplier.collectionName, supplier.id, supplierDto);
  }

  private updateSearchData(supplier: Supplier): Promise<any> {
    const supplierDto = plainToClass(AdminSupplierDto, supplier, { excludeExtraneousValues: true });
    return this.searchService.updateDocument(Supplier.collectionName, supplier.id, supplierDto);
  }

  private deleteSearchData(supplier: Supplier): Promise<any> {
    return this.searchService.deleteDocument(Supplier.collectionName, supplier.id);
  }

  private async searchByFilters(spf: AdminSPFDto, filters?: IFilter[]) {
    return this.searchService.searchByFilters<AdminSupplierDto>(
      Supplier.collectionName,
      filters || spf.getNormalizedFilters(),
      spf.skip,
      spf.limit,
      spf.getSortAsObj(),
      undefined,
      new ElasticSupplier()
    );
  }

  @CronProdPrimaryInstance(getCronExpressionEarlyMorning())
  private async reindexAllSearchData() {
    this.logger.log('Start reindex all search data');
    const suppliers = await this.supplierModel.find().exec();
    const dtos = suppliers.map(service => plainToClass(AdminSupplierDto, service, { excludeExtraneousValues: true }));

    await this.searchService.deleteCollection(Supplier.collectionName);
    await this.searchService.ensureCollection(Supplier.collectionName, new ElasticSupplier());
    await this.searchService.addDocuments(Supplier.collectionName, dtos);
    this.logger.log('Reindexed');
  }
}
