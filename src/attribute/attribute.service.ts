import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Attribute } from './models/attribute.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { AdminAttributeDto, AdminUpdateAttributeDto } from '../shared/dtos/admin/attribute.dto';

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

  async createAttribute(attributeDto: AdminAttributeDto): Promise<DocumentType<Attribute>> {
    const found = await this.attributeModel.findById(attributeDto.id).exec();
    if (found) {
      throw new BadRequestException(`Attribute with id '${attributeDto.id}' already exists`);
    }

    const attribute = new this.attributeModel(attributeDto);
    await attribute.save();

    return attribute;
  }

  async updateAttribute(attributeId: string, attributeDto: AdminUpdateAttributeDto): Promise<DocumentType<Attribute>> {
    const attribute = await this.getAttribute(attributeId);

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
      throw new NotFoundException(`No product with id '${attributeId}'`);
    }

    return deleted;
  }
}
