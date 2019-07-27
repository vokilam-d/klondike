import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

    const existProduct: InstanceType<Product> = await this.productService.findOne({ 'sku': sku });

    if (!existProduct) {
      throw new NotFoundException(`Product with sku '${sku}' doesn't exist`);
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
      throw new BadRequestException(`Not enough products '${sku}' in stock`);
    }

    const updatedCart = await this._model.findOneAndUpdate(
      { '_id': cartId, 'status': ECartStatus.ACTIVE },
      { '$push': { 'items': cartItem } },
      { 'upsert': true, 'new': true }
    );
    return updatedCart;
  }

  async setQtyInCart(cartId: Types.ObjectId, sku: string, newQty: number, oldQty: number): Promise<InstanceType<Cart>> {

    const updatedInventory = await this.inventory.updateCartedQty(sku, newQty, oldQty, cartId);
    if (!updatedInventory) {
      throw new ConflictException(`Not enough products '${sku}' in stock`);
    }

    const updated = await this._model.findOneAndUpdate(
      { '_id': cartId, 'items.sku': sku },
      { '$set': { 'items.$.qty': newQty } },
      { 'new': true }
    );

    return updated;
  }

  async removeFromCart(cartId: Types.ObjectId, sku: string, qty: number): Promise<InstanceType<Cart>> {

    await this.inventory.returnCartedToStock(sku, qty, cartId);

    const updated = await this._model.findOneAndUpdate(
      { '_id': cartId },
      { '$pull': { 'items': { 'sku': sku } } },
      { 'new': true }
    );
    return updated;
  }

}
