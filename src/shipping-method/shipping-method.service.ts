import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { ShippingMethod } from './models/shipping-method.model';
import { ShippingMethodDto } from '../shared/dtos/admin/shipping-method.dto';

@Injectable()
export class ShippingMethodService {
  constructor(@InjectModel(ShippingMethod.name) private readonly shippingMethodModel: ReturnModelType<typeof ShippingMethod>) {
  }

  async getAllShippingMethods(): Promise<ShippingMethod[]> {
    const methods = await this.shippingMethodModel.find().exec();
    return methods;
  }

  async createShippingMethod(methodDto: ShippingMethodDto): Promise<ShippingMethod> {
    const method = new this.shippingMethodModel(methodDto);
    await method.save();

    return method;
  }

  async updateShippingMethod(methodId: string, methodDto: ShippingMethodDto): Promise<ShippingMethod> {
    const found = await this.shippingMethodModel.findById(methodId);
    if (!found) {
      throw new NotFoundException(`Shipping method with id '${methodId}' not found`);
    }

    Object.keys(found).forEach(key => found[key] = methodDto[key]);
    await found.save();
    return found;
  }

  async deleteShippingMethod(methodId: string): Promise<ShippingMethod> {
    const deleted = await this.shippingMethodModel.findByIdAndDelete(methodId);
    if (!deleted) {
      throw new NotFoundException(`Shipping method with id '${methodId}' not found`);
    }

    return deleted;
  }
}
