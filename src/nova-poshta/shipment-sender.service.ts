import { BadRequestException, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from '@nestjs/mongoose';
import { ShipmentSender } from './models/shipment-sender.model';
import { __ } from '../shared/helpers/translate/translate.function';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ShipmentDto } from '../shared/dtos/admin/shipment.dto';
import { Language } from '../shared/enums/language.enum';

@Injectable()
export class ShipmentSenderService implements OnApplicationBootstrap {

  defaultSender: ShipmentSender;

  constructor(@InjectModel(ShipmentSender.name) private readonly shipmentSenderModel: ReturnModelType<typeof ShipmentSender>) {
  }

  async onApplicationBootstrap(): Promise<any> {
    await this.updateDefaultSender();
  }

  public async getAll(): Promise<ShipmentSender[]> {
    return this.shipmentSenderModel.find().exec();
  }

  public async getById(senderId: number, lang: Language): Promise<ShipmentSender> {
    if (!senderId) {
      throw new BadRequestException(__('Shipment sender id not provided', lang));
    }
    return this.shipmentSenderModel.findById(senderId).exec();
  }

  @Cron(CronExpression.EVERY_HOUR)
  private async updateDefaultSender() {
    const allSenders = await this.getAll();
    this.defaultSender = allSenders.find(sender => sender.isDefault) || allSenders[0];
  }
}
