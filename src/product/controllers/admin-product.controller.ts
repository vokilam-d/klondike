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
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { AdminAddOrUpdateProductDto, AdminProductDto } from '../../shared/dtos/admin/product.dto';
import { ProductService } from '../services/product.service';
import { plainToClass } from 'class-transformer';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';
import { AdminMediaDto } from '../../shared/dtos/admin/media.dto';
import { AdminSPFDto } from '../../shared/dtos/admin/spf.dto';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { AdminProductListItemDto } from '../../shared/dtos/admin/product-list-item.dto';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { ProductReorderDto } from '../../shared/dtos/admin/reorder.dto';
import { ReservedInventory } from '../../inventory/models/reserved-inventory.model';
import { OrderedProductService } from '../services/ordered-product.service';
import { AdminProductSPFDto } from '../../shared/dtos/admin/product-spf.dto';
import { UnfixProductOrderDto } from '../../shared/dtos/admin/unfix-product-order.dto';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/products')
export class AdminProductController {

  constructor(private readonly productsService: ProductService,
              private readonly orderedProductService: OrderedProductService,
  ) { }

  @Get()
  async getProducts(@Query() spf: AdminProductSPFDto): Promise<ResponseDto<AdminProductListItemDto[]>> {

    if (spf.hasOrderedDates()) {
      return this.orderedProductService.getAdminOrderedProductsList(spf, spf.getOrderedDates());
    } else {
      return this.productsService.getAdminProductsList(spf, spf.withVariants);
    }
  }

  @Get(':id')
  async getProduct(@Param('id') id: string): Promise<ResponseDto<AdminProductDto>> {
    const product = await this.productsService.getProductWithQtyById(parseInt(id));

    return {
      data: plainToClass(AdminProductDto, product, { excludeExtraneousValues: true })
    };
  }

  @Get(':id/breadcrumpsVariants')
  async getBreadcrumpsVariants(@Param('id') id: string): Promise<ResponseDto<AdminProductDto>> {
    return await this.productsService.getBreadcrumpsByProductId(parseInt(id));
  }

  @Get(':id/variants/:variantId/reserved')
  async getOrderIdsForReservedVariant(@Param('id') id: string, @Param('variantId') variantId: string): Promise<ResponseDto<number[]>> {
    const reservedInventory: ReservedInventory[] = await this.productsService.getReservedInventory(id, variantId);

    return {
      data: reservedInventory.map(inventory => inventory.orderId)
    }
  }

  @Post()
  async addProduct(@Body() productDto: AdminAddOrUpdateProductDto): Promise<ResponseDto<AdminProductDto>> {
    const created = await this.productsService.createProduct(productDto);

    return {
      data: plainToClass(AdminProductDto, created, { excludeExtraneousValues: true })
    };
  }

  /**
   * @returns AdminMediaDto
   */
  @Post('media')
  async uploadMedia(@Request() request: FastifyRequest, @Response() reply: FastifyReply<ServerResponse>) {
    const media = await this.productsService.uploadMedia(request);

    reply.status(201).send(media);
  }

  @Post('action/fix-sort-order')
  async fixProductSortOrder(
    @Body() reorderDto: ProductReorderDto,
    @Query() spf: AdminSPFDto
  ): Promise<ResponseDto<AdminProductListItemDto[]>> {

    await this.productsService.fixProductSortOrder(reorderDto);
    return this.productsService.getAdminProductsList(spf, false);
  }

  @Post('action/unfix-sort-order')
  async unFixProductSortOrder(
    @Body() unfixDto: UnfixProductOrderDto,
    @Query() spf: AdminSPFDto
  ): Promise<ResponseDto<AdminProductListItemDto[]>> {

    await this.productsService.unFixProductSortOrder(unfixDto);
    return this.productsService.getAdminProductsList(spf, false);
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
