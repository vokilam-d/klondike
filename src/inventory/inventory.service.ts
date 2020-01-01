import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Inventory } from './models/inventory.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { ClientSession, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class InventoryService {

  constructor(@InjectModel(Inventory.name) private readonly inventoryModel: ReturnModelType<typeof Inventory>) {
  }

  async createInventory(sku: string, productId: number, qty: number = 0, session: ClientSession): Promise<DocumentType<Inventory>> {
    const newInventory = new this.inventoryModel({ sku, productId, qty});
    await newInventory.save({ session });

    return newInventory;
  }

  async getInventory(sku: string): Promise<DocumentType<Inventory>> {
    const found = await this.inventoryModel.findOne({ sku }).exec();
    if (!found) {
      throw new NotFoundException(`Cannot find inventory for sku '${sku}'`);
    }

    return found;
  }

  async updateInventory(oldSku: string, newSku: string = oldSku, qty: number, session: ClientSession) {

    const found = await this.inventoryModel.findOne({ sku: oldSku }).session(session).exec();

    if (!found) {
      throw new NotFoundException(`Cannot find inventory with sku '${oldSku}'`);
    }

    const qtyInCarts = found.carted.reduce((sum, cart) => sum + cart.qty, 0);
    if (qtyInCarts > qty) {
      throw new ConflictException(`Cannot set quantity: more than ${qty} items are saved in carts`);
    }

    found.qty = qty - qtyInCarts;
    found.sku = newSku;

    await found.save({ session });

    return found;
  }

  async addCarted(sku: string, qty: number, cartId: Types.ObjectId) {
    const query = {
      'sku': sku,
      'qty': { '$gte': qty }
    };
    const update = {
      '$inc': { 'qty': -qty },
      '$push': { 'carted': { 'qty': qty, 'cartId': cartId, 'timestamp': new Date() } }
    };
    const options = { 'new': true };

    const updated = this.inventoryModel.findOneAndUpdate(query, update, options);
    return updated;
  }

  async updateCartedQty(sku: string, newQty: number, oldQty: number, cartId: Types.ObjectId) {
    const deltaQty = newQty - oldQty;

    const query = {
      'sku': sku,
      'qty': { '$gte': deltaQty },
      'carted.cartId': cartId
    };
    const update = {
      '$inc': { 'qty': -deltaQty },
      '$set': { 'carted.$.qty': newQty, 'timestamp': new Date() }
    };
    const options = { 'new': true };

    const updated = await this.inventoryModel.findOneAndUpdate(query, update, options);
    return updated;
  }

  async returnCartedToStock(sku: string, qty: number, cartId: Types.ObjectId) {
    const query = {
      'sku': sku,
      'carted.cartId': cartId,
      'carted.qty': qty
    };
    const update = {
      '$inc': { 'qty': qty },
      '$pull': { 'carted': { 'cartId': cartId } }
    };

    const updated = await this.inventoryModel.findOneAndUpdate(query, update);
    return updated;
  }

  deleteInventory(sku: string, session: ClientSession) {
    return this.inventoryModel.findOneAndDelete({ sku }).session(session).exec();
  }
}
