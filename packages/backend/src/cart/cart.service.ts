import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BackendCart } from './models/cart.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { BackendInventoryService } from '../inventory/backend-inventory.service';
import { BackendProduct } from '../product/models/product.model';
import { BackendCartItem } from './models/cart-item.model';
import { Types } from 'mongoose';
import { BackendProductService } from '../product/backend-product.service';
import { BackendCartItemDetails } from './models/cart-item-details.model';
import { ECartStatus } from '../../../shared/enums/cart.enum';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class BackendCartService {

  constructor(@InjectModel(BackendCart.name) private readonly cartModel: ReturnModelType<typeof BackendCart>,
              private readonly inventory: BackendInventoryService,
              private readonly productService: BackendProductService) {
  }

  async addToCart(cartId: Types.ObjectId, sku: string, qty: number): Promise<DocumentType<BackendCart>> {

    const existProduct: DocumentType<BackendProduct> = await this.productService.findOne({ 'sku': sku });

    if (!existProduct) {
      throw new NotFoundException(`Product with sku '${sku}' doesn't exist`);
    }

    const cartItem = new BackendCartItem();
    cartItem.sku = sku;
    cartItem.qty = qty;
    cartItem.details = new BackendCartItemDetails();
    cartItem.details.name = existProduct.name;

    const updatedInventory = await this.inventory.addCarted(sku, qty, cartId);
    if (!updatedInventory) {
      throw new BadRequestException(`Not enough products '${sku}' in stock`);
    }

    const updatedCart = await this.cartModel.findOneAndUpdate(
      { '_id': cartId, 'status': ECartStatus.ACTIVE },
      { '$push': { 'items': cartItem } },
      { 'upsert': true, 'new': true }
    );
    return updatedCart;
  }

  async setQtyInCart(cartId: Types.ObjectId, sku: string, newQty: number, oldQty: number): Promise<DocumentType<BackendCart>> {

    const updatedInventory = await this.inventory.updateCartedQty(sku, newQty, oldQty, cartId);
    if (!updatedInventory) {
      throw new ConflictException(`Not enough products '${sku}' in stock`);
    }

    const updated = await this.cartModel.findOneAndUpdate(
      { '_id': cartId, 'items.sku': sku },
      { '$set': { 'items.$.qty': newQty } },
      { 'new': true }
    );

    return updated;
  }

  async removeFromCart(cartId: Types.ObjectId, sku: string, qty: number): Promise<DocumentType<BackendCart>> {

    await this.inventory.returnCartedToStock(sku, qty, cartId);

    const updated = await this.cartModel.findOneAndUpdate(
      { '_id': cartId },
      { '$pull': { 'items': { 'sku': sku } } },
      { 'new': true }
    );
    return updated;
  }

  findOne(filter = {}, projection = {}) {
    return this.cartModel.findOne(filter, projection).exec();
  }

}
