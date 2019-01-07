import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ProductService } from './product.service';
import { IProduct } from '../../../shared/models/product.interface';
import { toObjectId } from '../shared/object-id.function';

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
    return product;
  }

  @Post()
  async addOne(@Body() product: IProduct) {

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
      const result = await this.productService.createProduct(product);
      return result;
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }

  }

  @Put(':id')
  async updateOne(@Param('id') id: string, @Body() product: IProduct) {

    const objectId = toObjectId(id, () => { throw new HttpException(`Invalid product ID`, HttpStatus.BAD_REQUEST); });

    let exist;
    try {
      exist = await this.productService.findById(objectId);
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!exist) {
      throw new HttpException(`Product with url '${product.slug}' not found`, HttpStatus.NOT_FOUND);
    }

    Object.keys(product).forEach(key => {
      exist[key] = product[key];
    });

    try {
      const result = await this.productService.update(objectId, exist);
      return result.toJSON();
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: string) {

    const objectId = toObjectId(id, () => { throw new HttpException(`Invalid product ID`, HttpStatus.BAD_REQUEST); });

    try {
      const deleted = await this.productService.delete(objectId);
      return deleted;
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
