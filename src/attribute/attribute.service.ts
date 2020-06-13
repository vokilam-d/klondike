import { BadRequestException, Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Attribute } from './models/attribute.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { AdminAttributeDto, AdminCreateAttributeDto, AdminUpdateAttributeDto } from '../shared/dtos/admin/attribute.dto';
import { AdminSPFDto } from '../shared/dtos/admin/spf.dto';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { SearchService } from '../shared/services/search/search.service';
import { ElasticAttributeModel } from './models/elastic-attribute.model';
import { __ } from '../shared/helpers/translate/translate.function';
import { CronProdPrimaryInstance } from '../shared/decorators/primary-instance-cron.decorator';
import { CronExpression } from '@nestjs/schedule';

@Injectable()
export class AttributeService implements OnApplicationBootstrap {

  private logger = new Logger(AttributeService.name);
  private cachedAttrbiutes: Attribute[] = [];

  constructor(@InjectModel(Attribute.name) private readonly attributeModel: ReturnModelType<typeof Attribute>,
              private readonly searchService: SearchService) {
  }

  onApplicationBootstrap(): any {
    this.searchService.ensureCollection(Attribute.collectionName, new ElasticAttributeModel());
    this.updateCachedAttributes();
  }

  async getAttributesResponse(spf: AdminSPFDto): Promise<ResponseDto<AdminAttributeDto[]>> {
    let attributes: AdminAttributeDto[];
    let itemsFiltered: number;

    if (spf.hasFilters()) {
      const searchResponse = await this.searchByFilters(spf);
      attributes = searchResponse[0];
      itemsFiltered = searchResponse[1];
    } else {
      attributes = await this.attributeModel
        .find()
        .sort(spf.getSortAsObj())
        .skip(spf.skip)
        .limit(spf.limit)
        .exec();

      attributes = plainToClass(AdminAttributeDto, attributes, { excludeExtraneousValues: true });
    }

    const itemsTotal = await this.countAttributes();
    const pagesTotal = Math.ceil(itemsTotal / spf.limit);
    return {
      data: attributes,
      itemsTotal,
      itemsFiltered,
      pagesTotal
    };
  }

  async getAllAttributes(): Promise<Attribute[]> {
    if (this.cachedAttrbiutes) {
      return this.cachedAttrbiutes;
    }

    const attributes = await this.attributeModel.find().exec();
    return attributes.map(attr => attr.toJSON());
  }

  async getAttribute(id: string): Promise<DocumentType<Attribute>> {
    const found = await this.attributeModel.findById(id).exec();
    if (!found) {
      throw new NotFoundException(__('Attribute with id "$1" not found', 'ru', id));
    }

    return found;
  }

  async createAttribute(attributeDto: AdminCreateAttributeDto): Promise<DocumentType<Attribute>> {
    const found = await this.attributeModel.findById(attributeDto.id).exec();
    if (found) {
      throw new BadRequestException(__('Attribute with id "$1" already exists', 'ru', attributeDto.id));
    }

    this.checkDtoForErrors(attributeDto);

    const attribute = new this.attributeModel(attributeDto);
    await attribute.save();
    this.addSearchData(attribute);
    this.updateCachedAttributes();

    return attribute;
  }

  async updateAttribute(attributeId: string, attributeDto: AdminUpdateAttributeDto): Promise<DocumentType<Attribute>> {
    const attribute = await this.getAttribute(attributeId);

    this.checkDtoForErrors(attributeDto);

    Object.keys(attributeDto)
      .forEach(key => {
        attribute[key] = attributeDto[key];
      });

    await attribute.save();
    this.updateSearchData(attribute);
    this.updateCachedAttributes();

    return attribute;
  }

  async deleteAttribute(attributeId: string): Promise<DocumentType<Attribute>> {
    const deleted = await this.attributeModel.findByIdAndDelete(attributeId).exec();
    if (!deleted) {
      throw new NotFoundException(__('Attribute with id "$1" not found', 'ru', attributeId));
    }
    this.deleteSearchData(deleted);
    this.updateCachedAttributes();

    return deleted;
  }

  countAttributes(): Promise<number> {
    return this.attributeModel.estimatedDocumentCount().exec();
  }

  @CronProdPrimaryInstance(CronExpression.EVERY_HOUR)
  updateCachedAttributes() {
    this.attributeModel.find()
      .then(attributes => this.cachedAttrbiutes = attributes.map(a => a.toJSON()))
      .catch(err => this.logger.warn(`Could not update cached attributes`, err));
  }

  private checkDtoForErrors(attributeDto: AdminCreateAttributeDto | AdminUpdateAttributeDto) {
    const defaults = [];
    const duplicateIds: string[] = [];
    attributeDto.values.forEach((value, index, array) => {
      if (value.isDefault) {
        defaults.push(value);
      }

      if (array.findIndex(arrayItem => arrayItem.id === value.id) !== index) {
        duplicateIds.push(value.id);
      }
    });

    const errors = [];
    if (defaults.length > 1) {
      errors.push(`Only one attribute value can be set as default, got ${defaults.length}.`);
    }
    if (duplicateIds.length > 0) {
      errors.push(`Attribute value codes must be unique, got duplicates: ${duplicateIds.join(', ')}`);
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join('\n'));
    }
  }

  private async addSearchData(attribute: Attribute) {
    const attributeDto = plainToClass(AdminAttributeDto, attribute, { excludeExtraneousValues: true });
    await this.searchService.addDocument(Attribute.collectionName, attribute.id, attributeDto);
  }

  private updateSearchData(attribute: Attribute): Promise<any> {
    const attributeDto = plainToClass(AdminAttributeDto, attribute, { excludeExtraneousValues: true });
    return this.searchService.updateDocument(Attribute.collectionName, attribute.id, attributeDto);
  }

  private deleteSearchData(attribute: Attribute): Promise<any> {
    return this.searchService.deleteDocument(Attribute.collectionName, attribute.id);
  }

  private async searchByFilters(spf: AdminSPFDto) {
    return this.searchService.searchByFilters<AdminAttributeDto>(
      Attribute.collectionName,
      spf.getNormalizedFilters(),
      spf.skip,
      spf.limit
    );
  }

  async clearCollection() { // todo remove this after migrate
    await this.attributeModel.deleteMany({}).exec();
    await this.searchService.deleteCollection(Attribute.collectionName);
    await this.searchService.ensureCollection(Attribute.collectionName, new ElasticAttributeModel());
  }
}
