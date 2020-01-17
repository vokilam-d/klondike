import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { ShippingMethod } from './models/shipping-method.model';
import { ShippingMethodDto } from '../shared/dtos/admin/shipping-method.dto';
import { Types } from 'mongoose';
import { toObjectId } from '../shared/object-id.function';

@Injectable()
export class ShippingMethodService {
  constructor(@InjectModel(ShippingMethod.name) private readonly shippingMethodModel: ReturnModelType<typeof ShippingMethod>) {
  }

  async getAllShippingMethods(): Promise<ShippingMethod[]> {
    const methods = await this.shippingMethodModel.find().exec();
    return methods.map(m => m.toJSON());
  }

  async createShippingMethod(methodDto: ShippingMethodDto): Promise<ShippingMethod> {
    const method = new this.shippingMethodModel(methodDto);
    await method.save();

    return method;
  }

  async updateShippingMethod(methodId: string, methodDto: ShippingMethodDto): Promise<ShippingMethod> {

    const found = await this.shippingMethodModel.findById(methodId).exec();
    if (!found) {
      throw new NotFoundException(`Shipping method with id '${methodId}' not found`);
    }

    Object.keys(methodDto).forEach(key => found[key] = methodDto[key]);
    await found.save();
    return found;
  }

  async deleteShippingMethod(methodId: string): Promise<ShippingMethod> {
    const deleted = await this.shippingMethodModel.findByIdAndDelete(this.toMethodId(methodId)).exec();
    if (!deleted) {
      throw new NotFoundException(`Shipping method with id '${methodId}' not found`);
    }

    return deleted;
  }

  private toMethodId(id: string): Types.ObjectId {
    return toObjectId(id, () => { throw new BadRequestException('Invalid shipping method ID'); });
  }
}
