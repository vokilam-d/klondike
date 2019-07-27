import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post
} from '@nestjs/common';
import { ProductService } from './product.service';
import { toObjectId } from '../shared/object-id.function';
import { ProductDto } from '../../../shared/dtos/product.dto';
import { Types } from 'mongoose';

@Controller('products')
export class ProductController {

  constructor(private readonly productService: ProductService) {
  }

  @Get()
  async getAll() {
    const products = await this.productService.findAll();
    return products.map(p => p.toJSON());
  }

  @Get(':slug')
  async getOne(@Param('slug') slug: string) {
    const product = await this.productService.findOne({ slug: slug });

    if (!product) {
      throw new NotFoundException(`Product with url '${slug} not found'`);
    }

    return product.toJSON();
  }

  @Post()
  async addOne(@Body() product: ProductDto) {

    const exist = await this.productService.findOne({ slug: product.slug });

    if (exist) {
      throw new BadRequestException(`Product with url '${product.slug}' already exists`);
    }

    return await this.productService.createProduct(product);
  }

  @Patch(':id')
  async updateOne(@Param('id') productId: string, @Body() productDto: ProductDto) {

    const objectProductId = this.toProductObjectId(productId);

    const exist = await this.productService.findById(objectProductId);

    if (!exist) {
      throw new NotFoundException(`Product with url '${productDto.slug}' not found`);
    }

    return await this.productService.updateProduct(exist, productDto);
  }

  @Delete(':id')
  async deleteOne(@Param('id') productId: string) {

    const objectProductId = this.toProductObjectId(productId);

    return await this.productService.deleteProduct(objectProductId);
  }

  private toProductObjectId(productId: string): Types.ObjectId {
    return toObjectId(productId, () => { throw new BadRequestException(`Invalid product ID`); });
  }
}
