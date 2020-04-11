import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Inventory } from './models/inventory.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { ClientSession } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { getPropertyOf } from '../shared/helpers/get-property-of.function';
import { ReservedInventory } from './models/reserved-inventory.model';

@Injectable()
export class InventoryService {

  constructor(@InjectModel(Inventory.name) private readonly inventoryModel: ReturnModelType<typeof Inventory>) {
  }

  async createInventory(sku: string, productId: number, qtyInStock: number = 0, session: ClientSession): Promise<DocumentType<Inventory>> {
    const model: Inventory = { sku, productId, qtyInStock, reserved: [] };
    const newInventory = new this.inventoryModel(model);
    await newInventory.save({ session });

    return newInventory;
  }

  async getInventory(sku: string, session?: ClientSession): Promise<DocumentType<Inventory>> {
    const found = await this.inventoryModel.findOne({ sku }).session(session).exec();
    if (!found) {
      throw new NotFoundException(`Cannot find inventory with sku '${sku}'`);
    }

    return found;
  }

  async updateInventory(oldSku: string, newSku: string = oldSku, qty: number, session: ClientSession) {

    const found = await this.getInventory(oldSku, session);

    const qtyInOrders = found.reserved.reduce((sum, ordered) => sum + ordered.qty, 0);
    if (qtyInOrders > qty) {
      throw new ForbiddenException(`Cannot set quantity: more than '${qty}' items are ordered`);
    }

    found.qtyInStock = qty - qtyInOrders;
    found.sku = newSku;

    await found.save({ session });

    return found;
  }

  addToOrdered(sku: string, qty: number, orderId: number, session: ClientSession): Promise<DocumentType<Inventory>> {
    const skuProp = getPropertyOf<Inventory>('sku');
    const qtyProp = getPropertyOf<Inventory>('qtyInStock');
    const reservedProp = getPropertyOf<Inventory>('reserved');
    const orderedInventory = new ReservedInventory();
    orderedInventory.qty = qty;
    orderedInventory.orderId = orderId;
    orderedInventory.timestamp = new Date();

    const query = {
      [skuProp]: sku,
      [qtyProp]: { '$gte': qty }
    };
    const update = {
      '$inc': { [qtyProp]: -qty },
      '$push': { [reservedProp]: orderedInventory }
    };
    const options = { 'new': true };

    return this.inventoryModel.findOneAndUpdate(query, update, options).session(session).exec();
  }

  async retrieveFromOrderedBackToStock(sku: string, orderId: number, session: ClientSession): Promise<DocumentType<Inventory>> {
    const skuProp = getPropertyOf<Inventory>('sku');
    const qtyProp = getPropertyOf<Inventory>('qtyInStock');
    const reservedProp = getPropertyOf<Inventory>('reserved');
    const orderIdProp = getPropertyOf<ReservedInventory>('orderId');
    const query = {
      [skuProp]: sku,
      [reservedProp + '.' + orderIdProp]: orderId
    };

    const found = await this.inventoryModel.findOne(query).exec();
    if (!found) {
      // what is better? return or throw
      throw new BadRequestException(`Reserved inventory for sku '${sku}' and order id '${orderId}' not found`);
    }

    const orderedQty = found.reserved.find(ordered => ordered.orderId === orderId).qty;

    const update = {
      '$inc': { [qtyProp]: orderedQty },
      '$pull': { [reservedProp]: { [orderIdProp]: orderId } }
    };
    const options = { 'new': true };

    return this.inventoryModel.findOneAndUpdate(query, update, options).session(session).exec();
  }

  async removeFromOrdered(sku: string, orderId: number, session: ClientSession): Promise<DocumentType<Inventory>> {
    const skuProp = getPropertyOf<Inventory>('sku');
    const reservedProp = getPropertyOf<Inventory>('reserved');
    const orderIdProp = getPropertyOf<ReservedInventory>('orderId');

    const query = {
      [skuProp]: sku,
      [reservedProp + '.' + orderIdProp]: orderId
    };
    const update = {
      '$pull': { [reservedProp]: { [orderIdProp]: orderId } }
    };
    const options = { 'new': true };

    return this.inventoryModel.findOneAndUpdate(query, update, options).session(session).exec();
  }

  deleteInventory(sku: string, session: ClientSession) {
    return this.inventoryModel.findOneAndDelete({ sku }).session(session).exec();
  }
}
