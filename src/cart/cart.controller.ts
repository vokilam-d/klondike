import { BadRequestException, Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { CartService } from './cart.service';
import { DocumentType } from '@typegoose/typegoose';
import { toObjectId } from '../shared/object-id.function';
import { Cart } from './models/cart.model';
import { Types } from 'mongoose';
import { CartDto } from '../../shared/dtos/cart.dto';

@Controller('cart')
export class CartController {

  constructor(private readonly cartService: CartService) {
  }

  @Post(':id/items')
  async addToCart(@Param('id') cartId: string, @Body() cartDto: CartDto) {
    const cartObjectId = this.toCartObjectId(cartId);
    cartDto.qty = cartDto.qty ? cartDto.qty : 1;

    const foundCart: DocumentType<Cart> = await this.cartService.findOne({ '_id': cartObjectId, 'items.sku': cartDto.sku }, { 'items.$.sku': 1 });

    if (foundCart) {
      const oldQty = foundCart.items[0].qty;
      const newQty = cartDto.qty + oldQty;

      return this.cartService.setQtyInCart(cartObjectId, cartDto.sku, newQty, oldQty);
    } else {
      return this.cartService.addToCart(cartObjectId, cartDto.sku, cartDto.qty);
    }
  }

  @Put(':id/items/quantity')
  async updateQty(@Param('id') cartId: string, @Body() cartDto: CartDto) {
    const cartObjectId = this.toCartObjectId(cartId);

    const foundItemInCart: DocumentType<Cart> = await this.cartService.findOne({ '_id': cartObjectId, 'items.sku': cartDto.sku }, { 'items.$.sku': 1 });

    if (!foundItemInCart) {
      throw new BadRequestException(`No '${cartId}' cart or no sku '${cartDto.sku}' in cart`);
    }

    return this.cartService.setQtyInCart(cartObjectId, cartDto.sku, cartDto.qty, foundItemInCart.items[0].qty);
  }

  @Delete(':id/items/:sku')
  async removeFromCart(@Param('id') cartId: string, @Param('sku') sku: string) {

    const foundItemInCart: DocumentType<Cart> = await this.cartService.findOne({ '_id': cartId, 'items.sku': sku }, { 'items.$.sku': 1 });

    if (!foundItemInCart) {
      throw new BadRequestException(`Cart '${cartId}' doesn't exist or has no SKU '${sku}'`);
    }

    const cartObjectId = this.toCartObjectId(cartId);
    return this.cartService.removeFromCart(cartObjectId, sku, foundItemInCart.items[0].qty);
  }

  private toCartObjectId(cartId: string): Types.ObjectId {
    return toObjectId(cartId, () => { throw new BadRequestException(`Invalid cart ID`); });
  }
}
