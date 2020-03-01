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
import { AdminSortingPaginatingFilterDto } from '../shared/dtos/admin/filter.dto';
import { ResponseDto } from '../shared/dtos/admin/response.dto';
import { AdminProductListItemDto } from '../shared/dtos/admin/product-list-item.dto';


@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/products')
export class AdminProductController {

  constructor(private readonly productsService: ProductService) {
  }

  @Get()
  async getProducts(@Query() spf: AdminSortingPaginatingFilterDto,
                    @Query('withVariants') withVariants: string): Promise<ResponseDto<AdminProductListItemDto[]>> {

    return this.productsService.getProductsList(spf, withVariants === 'true');
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

  @Post('counter') // todo remove this and all counter updates after migrate
  updateCounter() {
    return this.productsService.updateCounter();
  }
}
