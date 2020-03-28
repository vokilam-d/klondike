import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { ShippingMethod } from './models/shipping-method.model';
import { AdminShippingMethodDto } from '../shared/dtos/admin/shipping-method.dto';

@Injectable()
export class ShippingMethodService {
  constructor(@InjectModel(ShippingMethod.name) private readonly shippingMethodModel: ReturnModelType<typeof ShippingMethod>) {
  }

  async getAllShippingMethods(): Promise<ShippingMethod[]> {
    return this.shippingMethodModel.find().exec();
  }

  async getAllShippingMethodsForClient(): Promise<ShippingMethod[]> {
    const sortProp: keyof ShippingMethod = 'sortOrder';

    return this.shippingMethodModel
      .find({ isEnabled: true })
      .sort(`-${sortProp}`)
      .exec();
  }

  async getShippingMethodById(id: string): Promise<ShippingMethod> {
    return this.shippingMethodModel.findById(id).exec();
  }

  async createShippingMethod(methodDto: AdminShippingMethodDto): Promise<ShippingMethod> {
    const method = new this.shippingMethodModel(methodDto);
    await method.save();

    return method;
  }

  async updateShippingMethod(methodId: string, methodDto: AdminShippingMethodDto): Promise<ShippingMethod> {

    const found = await this.shippingMethodModel.findById(methodId).exec();
    if (!found) {
      throw new NotFoundException(`Shipping method with id '${methodId}' not found`);
    }

    Object.keys(methodDto).forEach(key => found[key] = methodDto[key]);
    await found.save();
    return found;
  }

  async deleteShippingMethod(methodId: string): Promise<ShippingMethod> {
    const deleted = await this.shippingMethodModel.findByIdAndDelete(methodId).exec();
    if (!deleted) {
      throw new NotFoundException(`Shipping method with id '${methodId}' not found`);
    }

    return deleted;
  }
}
