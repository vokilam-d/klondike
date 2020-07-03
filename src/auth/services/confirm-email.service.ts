import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { Customer } from '../../customer/models/customer.model';
import { createHash, randomBytes } from 'crypto';
import { ConfirmEmail } from '../models/confirm-email.model';
import { ResetPassword } from '../models/reset-password.model';

@Injectable()
export class ConfirmEmailService {

  private expirationDurationHours = 1;

  constructor(@InjectModel(ConfirmEmail.name) private readonly confirmEmailModel: ReturnModelType<typeof ConfirmEmail>) {
  }

  async create(customer: Customer): Promise<ConfirmEmail> {
    const randBytes = randomBytes(128);
    const token = createHash('sha256')
      .update(randBytes)
      .digest('hex');

    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + this.expirationDurationHours);

    const confirmEmail: ConfirmEmail = {
      expireDate,
      token,
      customerId: customer.id
    };

    const resetModel = await this.confirmEmailModel.findOneAndUpdate(
      { customerId: customer.id },
      confirmEmail,
      { new: true, upsert: true }
    ).exec();

    return resetModel.toJSON();
  }

  async getValidByToken(token: string): Promise<ConfirmEmail> {
    const found = await this.confirmEmailModel.findOne({ token }).exec();
    if (!found) { return; }

    if (found.expireDate < new Date()) {
      found.remove().catch();
      return;
    }

    return found;
  }

  deleteByToken(token: string): Promise<ResetPassword> {
    return this.confirmEmailModel.findOneAndDelete({ token }).exec();
  }
}
