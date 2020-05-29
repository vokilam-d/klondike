import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { ResetPassword } from '../models/reset-password.model';
import { Customer } from '../../customer/models/customer.model';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class ResetPasswordService {

  private expirationDurationHours = 1;

  constructor(@InjectModel(ResetPassword.name) private readonly resetPasswordModel: ReturnModelType<typeof ResetPassword>) {
  }

  async create(customer: Customer): Promise<ResetPassword> {
    const randBytes = randomBytes(128);
    const token = createHash('sha256')
      .update(randBytes)
      .digest('hex');

    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + this.expirationDurationHours);

    const resetPassword: ResetPassword = {
      expireDate,
      token,
      customerId: customer.id
    };

    const resetModel = await this.resetPasswordModel.findOneAndUpdate(
      { customerId: customer.id },
      resetPassword,
      { new: true, upsert: true }
    ).exec();

    return resetModel.toJSON();
  }

  async getValidByToken(token: string): Promise<ResetPassword> {
    const found = await this.resetPasswordModel.findOne({ token }).exec();
    if (!found) { return; }

    if (found.expireDate < new Date()) {
      found.remove().catch();
      return;
    }

    return found;
  }

  deleteByToken(token: string): Promise<ResetPassword> {
    return this.resetPasswordModel.findOneAndDelete({ token }).exec();
  }
}
