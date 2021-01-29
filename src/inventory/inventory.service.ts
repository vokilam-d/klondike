import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Inventory } from './models/inventory.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { ClientSession } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { getPropertyOf } from '../shared/helpers/get-property-of.function';
import { ReservedInventory } from './models/reserved-inventory.model';
import { __ } from '../shared/helpers/translate/translate.function';
import { FileLogger } from '../logger/file-logger.service';
import { ShipmentDto } from '../shared/dtos/admin/shipment.dto';
import { Language } from '../shared/enums/language.enum';

@Injectable()
export class InventoryService {

  constructor(@InjectModel(Inventory.name) private readonly inventoryModel: ReturnModelType<typeof Inventory>,
              private readonly logger: FileLogger
  ) {
    this.logger.setContext(InventoryService.name);
  }

  async createInventory(sku: string, productId: number, qtyInStock: number = 0, session: ClientSession): Promise<DocumentType<Inventory>> {
    const model: Inventory = { sku, productId, qtyInStock, reserved: [] };
    const newInventory = new this.inventoryModel(model);
    await newInventory.save({ session });

    return newInventory;
  }

  async getInventory(sku: string, lang: Language, session?: ClientSession): Promise<DocumentType<Inventory>> {
    const found = await this.inventoryModel.findOne({ sku }).session(session).exec();
    if (!found) {
      throw new NotFoundException(__('Cannot find inventory with sku "$1"', lang, sku));
    }

    return found;
  }

  async updateInventory(oldSku: string, newSku: string = oldSku, qty: number, lang: Language, session: ClientSession) {

    const found = await this.getInventory(oldSku, lang, session);

    const qtyInOrders = found.reserved.reduce((sum, ordered) => sum + ordered.qty, 0);
    if (qtyInOrders > qty) {
      throw new ForbiddenException(__('Cannot set quantity: more than "$1" items are ordered', lang, qty));
    }

    found.qtyInStock = qty;
    found.sku = newSku;

    await found.save({ session });

    this.logger.log(`Updated inventory: sku=${found.sku}, qtyInStock=${found.qtyInStock}`, undefined);

    return found;
  }

  async addToStock(sku: string, qty: number, session: ClientSession): Promise<DocumentType<Inventory>> {
    const inventory = await this.inventoryModel
      .findOneAndUpdate(
        { sku },
        { $inc: { qtyInStock: qty } },
        { new: true }
      )
      .session(session)
      .exec();

    this.logger.log(`Added to stock: sku=${inventory.sku}, qty added=${qty}, new qtyInStock=${inventory.qtyInStock}`);

    return inventory;
  }

  async addToOrdered(sku: string, qty: number, orderId: number, session: ClientSession): Promise<DocumentType<Inventory>> {
    const orderedInventory = new ReservedInventory();
    orderedInventory.qty = qty;
    orderedInventory.orderId = orderId;
    orderedInventory.timestamp = new Date();

    const inventory = await this.inventoryModel
      .findOneAndUpdate(
        {
          sku,
          qtyInStock: { $gte: qty }
        },
        { $push: { reserved: orderedInventory } },
        { new: true }
      )
      .session(session)
      .exec();

    this.logger.log(`Added to ordered: sku=${inventory.sku}, qtyInStock=${inventory.qtyInStock}, orderId=${orderId}, orderedQty=${qty}`);

    return inventory;
  }

  async removeFromOrdered(sku: string, orderId: number, session: ClientSession): Promise<DocumentType<Inventory>> {
    const reservedProp = getPropertyOf<Inventory>('reserved');
    const orderIdProp = getPropertyOf<ReservedInventory>('orderId');

    const inventory = await this.inventoryModel
      .findOneAndUpdate(
        {
          sku,
          [reservedProp + '.' + orderIdProp]: orderId
        },
        {
          $pull: { reserved: { orderId } }
        },
        {
          new: true
        }
      )
      .session(session)
      .exec();

    this.logger.log(`Removed from ordered: sku=${inventory.sku}, qtyInStock=${inventory.qtyInStock}, orderId=${orderId}`);

    return inventory;
  }

  async removeFromOrderedAndStock(sku: string, qty: number, orderId: number, session: ClientSession): Promise<DocumentType<Inventory>> {
    const reservedProp = getPropertyOf<Inventory>('reserved');
    const orderIdProp = getPropertyOf<ReservedInventory>('orderId');

    const inventory = await this.inventoryModel
      .findOneAndUpdate(
        {
          sku,
          [reservedProp + '.' + orderIdProp]: orderId
        },
        {
          $inc: { qtyInStock: -qty },
          $pull: { reserved: { orderId } }
        },
        {
          new: true
        }
      )
      .session(session)
      .exec();

    this.logger.log(`Removed from ordered and stock: sku=${inventory.sku}, qty removed=${qty}, new qtyInStock=${inventory.qtyInStock}, orderId=${orderId}`);

    return inventory;
  }

  deleteInventory(sku: string, session: ClientSession) {
    return this.inventoryModel.findOneAndDelete({ sku }).session(session).exec();
  }

  deleteAllInventory() {
    return this.inventoryModel.deleteMany({}).exec();
  }
}
