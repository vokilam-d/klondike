import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from '@nestjs/mongoose';
import { ShipmentSender } from './models/shipment-sender.model';
import { ShipmentSenderDto } from '../shared/dtos/admin/shipment-sender.dto';
import { __ } from '../shared/helpers/translate/translate.function';

@Injectable()
export class ShipmentSenderService {

  constructor(@InjectModel(ShipmentSender.name) private readonly shipmentSenderModel: ReturnModelType<typeof ShipmentSender>) {
  }

  public async getAll(): Promise<ShipmentSenderDto[]> {
    return this.shipmentSenderModel.find().exec();
  }

  public async getById(senderId: number): Promise<ShipmentSenderDto> {
    if (!senderId) {
      throw new BadRequestException(__('Shipment sender not provided', 'ru'));
    }
    let shipmentSenders = await this.shipmentSenderModel.findById(senderId).exec();
    return plainToClass(ShipmentSenderDto, shipmentSenders,{ excludeExtraneousValues: true });
  }

}
