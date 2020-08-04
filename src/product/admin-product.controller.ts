import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  Response,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { AdminAddOrUpdateProductDto, AdminProductDto } from '../shared/dtos/admin/product.dto';
import { ProductService } from './product.service';
import { plainToClass } from 'class-transformer';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';
import { AdminMediaDto } from '../shared/dtos/admin/media.dto';
import { AdminSPFDto } from '../shared/dtos/admin/spf.dto';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { AdminProductListItemDto } from '../shared/dtos/admin/product-list-item.dto';
import { UserJwtGuard } from '../auth/guards/user-jwt.guard';
import { ProductReorderDto } from '../shared/dtos/admin/reorder.dto';
import { Product } from './models/product.model';
import { ProductCategory } from './models/product-category.model';
import { AdminProductCategoryDto } from '../shared/dtos/admin/product-category.dto';
import { ReservedInventory } from '../inventory/models/reserved-inventory.model';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/products')
export class AdminProductController {

  constructor(private readonly productsService: ProductService) {
  }

  @Get()
  async getProducts(@Query() spf: AdminSPFDto,
                    @Query('withVariants') withVariants: string): Promise<ResponseDto<AdminProductListItemDto[]>> {

    return this.productsService.getAdminProductsList(spf, withVariants === 'true');
  }

  @Get(':id')
  async getProduct(@Param('id') id: string): Promise<ResponseDto<AdminProductDto>> {
    const product = await this.productsService.getProductWithQtyById(parseInt(id));

    return {
      data: plainToClass(AdminProductDto, product, { excludeExtraneousValues: true })
    };
  }

  @Get(':id/variants/:variantId/reserved')
  async getOrderIdsForReservedVariant(@Param('id') id: string, @Param('variantId') variantId: string): Promise<ResponseDto<number[]>> {
    const reservedInventory: ReservedInventory[] = await this.productsService.getReservedInventory(id, variantId);

    return {
      data: reservedInventory.map(inventory => inventory.orderId)
    }
  }

  @Post()
  async addProduct(@Body() productDto: AdminAddOrUpdateProductDto, @Query('migrate') migrate: any): Promise<ResponseDto<AdminProductDto>> {
    const created = await this.productsService.createProduct(productDto, migrate);

    return {
      data: plainToClass(AdminProductDto, created, { excludeExtraneousValues: true })
    };
  }

  @Post('migrate-linked') // todo remove this after migrate
  async migrateLinked() {
    return this.productsService.migrateLinked();
  }

  /**
   * @returns AdminMediaDto
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

  @Post('clear-collection') // todo remove this and all counter updates
  clearCollection() {
    return this.productsService.clearCollection();
  }

  @Post('action/reorder')
  async reorderProduct(@Body() reorderDto: ProductReorderDto,
                       @Query() spf: AdminSPFDto
  ): Promise<ResponseDto<AdminProductListItemDto[]>> {

    await this.productsService.reorderProduct(reorderDto);
    return this.productsService.getAdminProductsList(spf, false);
  }

  @Patch(':id/categories') // temp method, todo remove after migrate
  async updateCategories(@Param('id') productId: number, @Body() productDto: AdminProductCategoryDto[]) {
    return this.productsService.migrateProductCategories(productId, productDto);
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
}
