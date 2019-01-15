import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cart } from './models/cart.model';
import { InstanceType, ModelType } from 'typegoose';
import { BaseService } from '../shared/base.service';
import { InventoryService } from '../inventory/inventory.service';
import { ECartStatus } from '../../../shared/models/cart.interface';
import { Product } from '../product/models/product.model';
import { CartItem } from './models/cart-item.model';
import { Types } from 'mongoose';
import { ProductService } from '../product/product.service';

@Injectable()
export class CartService extends BaseService<Cart> {

  constructor(@InjectModel(Cart.modelName) _cartModel: ModelType<Cart>,
              private readonly inventory: InventoryService,
              private readonly productService: ProductService) {
    super();
    this._model = _cartModel;
  }

  async addToCart(cartId: Types.ObjectId, sku: string, qty: number): Promise<InstanceType<Cart>> {

    let existProduct: InstanceType<Product>;
    try {
      existProduct = await this.productService.findOne({ 'sku': sku });
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!existProduct) {
      throw new HttpException(`Product with sku '${sku}' doesn't exist`, HttpStatus.NOT_FOUND);
    }

    const cartItem: CartItem = {
      sku: sku,
      qty: qty,
      details: {
        name: existProduct.name
      }
    };

    const updatedInventory = await this.inventory.addCarted(sku, qty, cartId);
    if (!updatedInventory) {
      throw new HttpException(`Not enough products '${sku}' in stock`, HttpStatus.BAD_REQUEST);
    }

    let updatedCart;
    try {
      updatedCart = await this._model.findOneAndUpdate(
        { '_id': cartId, 'status': ECartStatus.ACTIVE },
        { '$push': { 'items': cartItem } },
        { 'upsert': true, 'new': true }
      );
      return updatedCart;

    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async setQtyInCart(cartId: Types.ObjectId, sku: string, newQty: number, oldQty: number): Promise<InstanceType<Cart>> {

    const updatedInventory = await this.inventory.updateCartedQty(sku, newQty, oldQty, cartId);
    if (!updatedInventory) {
      throw new HttpException(`Not enough products '${sku}' in stock`, HttpStatus.CONFLICT);
    }

    try {
      const updated = await this._model.findOneAndUpdate(
        { '_id': cartId, 'items.sku': sku },
        { '$set': { 'items.$.qty': newQty } },
        { 'new': true }
      );

      return updated;
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async removeFromCart(cartId: Types.ObjectId, sku: string, qty: number): Promise<InstanceType<Cart>> {

    await this.inventory.returnCartedToStock(sku, qty, cartId);

    try {
      const updated = await this._model.findOneAndUpdate(
        { '_id': cartId },
        { '$pull': { 'items': { 'sku': sku } } },
        { 'new': true }
      );

      return updated;
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
