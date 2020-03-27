import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { PaymentMethodDto } from '../shared/dtos/admin/payment-method.dto';
import { PaymentMethod } from './models/payment-method.model';

@Injectable()
export class PaymentMethodService {
  constructor(@InjectModel(PaymentMethod.name) private readonly paymentMethodModel: ReturnModelType<typeof PaymentMethod>) {
  }

  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    const methods = await this.paymentMethodModel.find().exec();
    return methods;
  }

  getPaymentMethodById(paymentMethodId: string): Promise<PaymentMethod> {
    return this.paymentMethodModel.findById(paymentMethodId).exec();
  }

  async createPaymentMethod(methodDto: PaymentMethodDto): Promise<PaymentMethod> {
    const method = new this.paymentMethodModel(methodDto);
    await method.save();

    return method;
  }

  async updatePaymentMethod(methodId: string, methodDto: PaymentMethodDto): Promise<PaymentMethod> {
    const found = await this.paymentMethodModel.findById(methodId);
    if (!found) {
      throw new NotFoundException(`Payment method with id '${methodId}' not found`);
    }

    Object.keys(methodDto).forEach(key => found[key] = methodDto[key]);
    await found.save();
    return found;
  }

  async deletePaymentMethod(methodId: string): Promise<PaymentMethod> {
    const deleted = await this.paymentMethodModel.findByIdAndDelete(methodId);
    if (!deleted) {
      throw new NotFoundException(`Payment method with id '${methodId}' not found`);
    }

    return deleted;
  }
}
