import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post } from '@nestjs/common';
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
    try {
      const products = await this.productService.findAll();
      return products.map(p => p.toJSON());

    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':slug')
  async getOne(@Param('slug') slug: string) {
    let product;
    try {
      product = await this.productService.findOne({ slug: slug });
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!product) {
      throw new HttpException(`Product with url '${slug} not found'`, HttpStatus.NOT_FOUND);
    }

    return product.toJSON();
  }

  @Post()
  async addOne(@Body() product: ProductDto) {

    let exist;
    try {
      exist = await this.productService.findOne({ slug: product.slug });
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (exist) {
      throw new HttpException(`Product with url '${product.slug}' already exists`, HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.productService.createProduct(product);
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id')
  async updateOne(@Param('id') productId: string, @Body() productDto: ProductDto) {

    const objectProductId = this.toProductObjectId(productId);

    let exist;
    try {
      exist = await this.productService.findById(objectProductId);
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!exist) {
      throw new HttpException(`Product with url '${productDto.slug}' not found`, HttpStatus.NOT_FOUND);
    }

    try {
      return await this.productService.updateProduct(exist, productDto);
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async deleteOne(@Param('id') productId: string) {

    const objectProductId = this.toProductObjectId(productId);

    try {
      return await this.productService.deleteProduct(objectProductId);
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private toProductObjectId(productId: string): Types.ObjectId {
    return toObjectId(productId, () => { throw new HttpException(`Invalid product ID`, HttpStatus.BAD_REQUEST); });
  }
}
