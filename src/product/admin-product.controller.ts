import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  Response,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { AdminAddOrUpdateProductDto, AdminProductDto } from '../shared/dtos/admin/product.dto';
import { ProductService } from './product.service';
import { plainToClass } from 'class-transformer';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';
import { MediaDto } from '../shared/dtos/admin/media.dto';
import { AdminSortingPaginatingDto } from '../shared/dtos/admin/filter.dto';
import { ResponseDto, ResponsePaginationDto } from '../shared/dtos/admin/response.dto';



@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/products')
export class AdminProductController {

  constructor(private readonly productsService: ProductService) {
  }

  @Get()
  async getProducts(@Query() sortingPaging: AdminSortingPaginatingDto): Promise<ResponsePaginationDto<AdminProductDto[]>> {
    const [ results, itemsTotal ] = await Promise.all([this.productsService.getAllProductsWithQty(sortingPaging), this.productsService.countProducts()]);
    const pagesTotal = Math.ceil(itemsTotal / sortingPaging.limit);

    return {
      data: plainToClass(AdminProductDto, results, { excludeExtraneousValues: true }),
      page: sortingPaging.page,
      pagesTotal,
      itemsTotal
    };
  }

  @Get(':id')
  async getProduct(@Param('id') id: string): Promise<ResponseDto<AdminProductDto>> {
    const product = await this.productsService.getProductWithQtyById(parseInt(id));

    return {
      data: plainToClass(AdminProductDto, product, { excludeExtraneousValues: true })
    };
  }

  @Post()
  async addProduct(@Body() productDto: AdminAddOrUpdateProductDto, @Query('migrate') migrate: any): Promise<ResponseDto<AdminProductDto>> {
    const created = await this.productsService.createProduct(productDto, migrate);

    return {
      data: plainToClass(AdminProductDto, created, { excludeExtraneousValues: true })
    };
  }

  @Put(':id')
  async updateProduct(@Param('id') productId: number, @Body() productDto: AdminAddOrUpdateProductDto): Promise<ResponseDto<AdminProductDto>> {
    const updated = await this.productsService.updateProduct(productId, productDto);

    return {
      data: plainToClass(AdminProductDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Delete(':id')
  async deleteProduct(@Param('id') productId: number): Promise<ResponseDto<AdminProductDto>> {
    const deleted = await this.productsService.deleteProduct(productId);

    return {
      data: plainToClass(AdminProductDto, deleted, { excludeExtraneousValues: true })
    };
  }

  /**
   * @returns MediaDto
   */
  @Post('media')
  async uploadMedia(@Request() request: FastifyRequest, @Response() reply: FastifyReply<ServerResponse>) {
    const media = await this.productsService.uploadMedia(request);

    reply.status(201).send(media);
  }
}
