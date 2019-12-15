import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put, Query,
  Request,
  Response,
  UseInterceptors, UsePipes, ValidationPipe
} from '@nestjs/common';
import { AdminAddOrUpdateProductDto, AdminResponseProductDto } from '../shared/dtos/admin/product.dto';
import { ProductService } from './product.service';
import { plainToClass } from 'class-transformer';
import { Product } from './models/product.model';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';
import { MediaDto } from '../shared/dtos/admin/media.dto';
import { AdminSortingPaginatingDto } from '../shared/dtos/admin/filter.dto';
import { ListResponseDto } from '../shared/dtos/admin/common-response.dto';

type ProductWithQty = Product & { qty?: number };

@Controller('admin/products')
export class AdminProductController {

  constructor(private readonly productsService: ProductService) {
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(ClassSerializerInterceptor)
  @Get()
  async getProducts(@Query() sortingPaging: AdminSortingPaginatingDto): Promise<ListResponseDto<AdminResponseProductDto[]>> {
    const [ results, itemsTotal ] = await Promise.all([this.productsService.getProducts(sortingPaging), this.productsService.countProducts()]);
    const pagesTotal = Math.floor(itemsTotal / sortingPaging.limit);

    // const backendProductsWithQty = await this.populateProductsWithQty(backendProducts);

    return {
      data: plainToClass(AdminResponseProductDto, results, { excludeExtraneousValues: true }),
      page: sortingPaging.page,
      pagesTotal,
      itemsTotal
    };
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id')
  async getProduct(@Param('id') id: string) {
    const product = await this.productsService.getProductById(parseInt(id));
    const productsWithQty = await this.populateProductsWithQty([product.toJSON()]);

    return plainToClass(AdminResponseProductDto, productsWithQty[0], { excludeExtraneousValues: true });
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(ClassSerializerInterceptor)
  @Post()
  async addProduct(@Body() productDto: AdminAddOrUpdateProductDto): Promise<AdminResponseProductDto> {
    const created = await this.productsService.createProduct(productDto);

    return plainToClass(AdminResponseProductDto, created, { excludeExtraneousValues: true });
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(ClassSerializerInterceptor)
  @Put(':id')
  async updateProduct(@Param('id') productId: number, @Body() productDto: AdminAddOrUpdateProductDto): Promise<AdminResponseProductDto> {
    const updated = await this.productsService.updateProduct(productId, productDto);

    return plainToClass(AdminResponseProductDto, updated, { excludeExtraneousValues: true });
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Delete(':id')
  async deleteProduct(@Param('id') productId: number): Promise<AdminResponseProductDto> {
    const deleted = await this.productsService.deleteProduct(productId);

    return plainToClass(AdminResponseProductDto, deleted, { excludeExtraneousValues: true });
  }

  /**
   * @returns MediaDto
   */
  @Post('media')
  async uploadMedia(@Request() request: FastifyRequest, @Response() reply: FastifyReply<ServerResponse>) {
    const media = await this.productsService.uploadMedia(request);

    reply.status(201).send(media);
  }

  private async populateProductsWithQty(products: Product[]): Promise<ProductWithQty[]> {
    return Promise.all( //aggregate vs multiple reqs
      products.map(async product => {
        const qty = await this.productsService.getProductQty(product);
        return {
          ...product,
          qty
        } as ProductWithQty;
      })
    );
  }
}
