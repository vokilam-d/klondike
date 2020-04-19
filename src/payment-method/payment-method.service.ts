import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { AdminPaymentMethodDto } from '../shared/dtos/admin/payment-method.dto';
import { PaymentMethod } from './models/payment-method.model';
import { __ } from '../shared/helpers/translate/translate.function';

@Injectable()
export class PaymentMethodService {
  constructor(@InjectModel(PaymentMethod.name) private readonly paymentMethodModel: ReturnModelType<typeof PaymentMethod>) {
  }

  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    return this.paymentMethodModel.find().exec();
  }

  async getAllPaymentMethodsForClient(): Promise<PaymentMethod[]> {
    const sortProp: keyof PaymentMethod = 'sortOrder';

    return this.paymentMethodModel
      .find({ isEnabled: true })
      .sort(`-${sortProp}`)
      .exec();
  }

  getPaymentMethodById(paymentMethodId: string): Promise<PaymentMethod> {
    return this.paymentMethodModel.findById(paymentMethodId).exec();
  }

  async createPaymentMethod(methodDto: AdminPaymentMethodDto): Promise<PaymentMethod> {
    const method = new this.paymentMethodModel(methodDto);
    await method.save();

    return method;
  }

  async updatePaymentMethod(methodId: string, methodDto: AdminPaymentMethodDto): Promise<PaymentMethod> {
    const found = await this.paymentMethodModel.findById(methodId);
    if (!found) {
      throw new NotFoundException(__('Payment method with id "$1" not found', 'ru', methodId));
    }

    Object.keys(methodDto).forEach(key => found[key] = methodDto[key]);
    await found.save();
    return found;
  }

  async deletePaymentMethod(methodId: string): Promise<PaymentMethod> {
    const deleted = await this.paymentMethodModel.findByIdAndDelete(methodId);
    if (!deleted) {
      throw new NotFoundException(__('Payment method with id "$1" not found', 'ru', methodId));
    }

    return deleted;
  }
}
