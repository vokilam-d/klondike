import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Inventory } from './models/inventory.model';
import { InstanceType, ModelType } from 'typegoose';
import { BaseService } from '../shared/base.service';
import { Types } from 'mongoose';

@Injectable()
export class InventoryService extends BaseService<Inventory> {

  constructor(@InjectModel(Inventory.modelName) _inventoryModel: ModelType<Inventory>) {
    super();
    this._model = _inventoryModel;
  }

  async createInventory(sku: string, productId: Types.ObjectId, qty: number = 0): Promise<InstanceType<Inventory>> {
    const inventory = Inventory.createModel();

    inventory._id = sku;
    inventory.productId = productId;
    inventory.qty = qty;

    const created = await this.create(inventory);
    return created;
  }

  async setInventoryQty(sku: string, qty: number) {

    const found: InstanceType<Inventory> = await this._model.findOne({ '_id': sku });

    const qtyInCarts = found.carted.reduce((sum, cart) => sum + cart.qty, 0);

    if (qtyInCarts > qty) {
      throw new ConflictException(`Cannot set quantity: more than ${qty} items are saved in carts`);
    }

    const updated = this._model.findOneAndUpdate(
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

    const updated = this._model.findOneAndUpdate(query, update, options);
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

    const updated = await this._model.findOneAndUpdate(query, update, options);
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

    const updated = await this._model.findOneAndUpdate(query, update);
    return updated;
  }
}
