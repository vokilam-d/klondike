import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Attribute } from './models/attribute.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { AdminCreateAttributeDto, AdminUpdateAttributeDto } from '../shared/dtos/admin/attribute.dto';

@Injectable()
export class AttributeService {

  constructor(@InjectModel(Attribute.name) private readonly attributeModel: ReturnModelType<typeof Attribute>) {
  }

  async getAllAttributes(): Promise<Attribute[]> {
    const attributes = await this.attributeModel.find().exec();

    return attributes.map(a => a.toJSON());
  }

  async getAttribute(id: string): Promise<DocumentType<Attribute>> {
    const found = await this.attributeModel.findById(id).exec();
    if (!found) {
      throw new NotFoundException(`Attribute with id '${id}' not found`);
    }

    return found;
  }

  async createAttribute(attributeDto: AdminCreateAttributeDto): Promise<DocumentType<Attribute>> {
    const found = await this.attributeModel.findById(attributeDto.id).exec();
    if (found) {
      throw new BadRequestException(`Attribute with id '${attributeDto.id}' already exists`);
    }

    this.checkDtoForErrors(attributeDto);

    const attribute = new this.attributeModel(attributeDto);
    await attribute.save();

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

    return attribute;
  }

  async deleteAttribute(attributeId: string): Promise<DocumentType<Attribute>> {
    const deleted = await this.attributeModel.findByIdAndDelete(attributeId).exec();
    if (!deleted) {
      throw new NotFoundException(`No attribute with id '${attributeId}'`);
    }

    return deleted;
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
}
