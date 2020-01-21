import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Cart } from './models/cart.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { InventoryService } from '../inventory/inventory.service';
import { Product } from '../product/models/product.model';
import { CartItem } from './models/cart-item.model';
import { Types } from 'mongoose';
import { ProductService } from '../product/product.service';
import { CartItemDetails } from './models/cart-item-details.model';
import { ECartStatus } from '../../shared/enums/cart.enum';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class CartService {

  constructor(@InjectModel(Cart.name) private readonly cartModel: ReturnModelType<typeof Cart>,
              private readonly inventory: InventoryService,
              private readonly productService: ProductService) {
  }

  async addToCart(cartId: Types.ObjectId, sku: string, qty: number): Promise<DocumentType<Cart>> {

    // const product: DocumentType<Product> = await this.productService.getProductBySku(sku);
    let product: DocumentType<Product>;
    const cartItem = new CartItem();
    cartItem.sku = sku;
    cartItem.qty = qty;
    cartItem.details = new CartItemDetails();
    cartItem.details.name = product.name;

    // const updatedInventory = await this.inventory.addCarted(sku, qty, cartId);
    // if (!updatedInventory) {
    //   throw new BadRequestException(`Not enough products '${sku}' in stock`);
    // }

    const updatedCart = await this.cartModel.findOneAndUpdate(
      { '_id': cartId, 'status': ECartStatus.ACTIVE },
      { '$push': { 'items': cartItem } },
      { 'upsert': true, 'new': true }
    );
    return updatedCart;
  }

  async setQtyInCart(cartId: Types.ObjectId, sku: string, newQty: number, oldQty: number): Promise<DocumentType<Cart>> {

    // const updatedInventory = await this.inventory.updateCartedQty(sku, newQty, oldQty, cartId);
    // if (!updatedInventory) {
    //   throw new ConflictException(`Not enough products '${sku}' in stock`);
    // }

    const updated = await this.cartModel.findOneAndUpdate(
      { '_id': cartId, 'items.sku': sku },
      { '$set': { 'items.$.qty': newQty } },
      { 'new': true }
    );

    return updated;
  }

  async removeFromCart(cartId: Types.ObjectId, sku: string, qty: number): Promise<DocumentType<Cart>> {

    // await this.inventory.returnCartedToStock(sku, qty, cartId);

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
