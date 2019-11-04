import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BackendInventory } from './models/inventory.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class BackendInventoryService {

  constructor(@InjectModel(BackendInventory.name) private readonly inventoryModel: ReturnModelType<typeof BackendInventory>) {
  }

  async createInventory(sku: string, productId: number, qty: number = 0): Promise<DocumentType<BackendInventory>> {
    const created = await this.inventoryModel.create({
      _id: sku,
      productId,
      qty
    });

    return created;
  }

  async getInventory(sku: string): Promise<DocumentType<BackendInventory>> {
    const found = await this.inventoryModel.findById(sku).exec();
    if (!found) {
      throw new NotFoundException(`Cannot find inventory for sku '${sku}'`);
    }

    return found;
  }

  async setInventoryQty(sku: string, qty: number) {

    const found = await this.inventoryModel.findOne({ '_id': sku });

    if (!found) {
      throw new NotFoundException(`Cannot find inventory with sku '${sku}'`);
    }

    const qtyInCarts = found.carted.reduce((sum, cart) => sum + cart.qty, 0);

    if (qtyInCarts > qty) {
      throw new ConflictException(`Cannot set quantity: more than ${qty} items are saved in carts`);
    }

    const updated = this.inventoryModel.findOneAndUpdate(
      { '_id': sku },
      { 'qty': qty - qtyInCarts },
      { 'new': true }
    );
    return updated;
  }

  async addCarted(sku: string, qty: number, cartId: Types.ObjectId) {
    const query = {
      '_id': sku,
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
      '_id': sku,
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
      '_id': sku,
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

  deleteOne(productId: number) {
    return this.inventoryModel.findOneAndDelete({ productId }).exec();
  }
}
