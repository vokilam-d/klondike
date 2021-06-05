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
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { AdminAddOrUpdateProductDto, AdminProductDto } from '../../shared/dtos/admin/product.dto';
import { AdminProductService } from '../services/admin-product.service';
import { plainToClass } from 'class-transformer';
import { FastifyRequest } from 'fastify';
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
import { AdminLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';
import { ValidatedUser } from '../../shared/decorators/validated-user.decorator';
import { DocumentType } from '@typegoose/typegoose';
import { User } from '../../user/models/user.model';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/products')
export class AdminProductController {

  constructor(private readonly productsService: AdminProductService,
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
  async getProduct(
    @Param('id') id: string,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminProductDto>> {
    const product = await this.productsService.getAdminProduct(parseInt(id), lang);

    return {
      data: plainToClass(AdminProductDto, product, { excludeExtraneousValues: true })
    };
  }

  @Get(':id/variants/:variantId/reserved')
  async getOrderIdsForReservedVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<number[]>> {
    const reservedInventory: ReservedInventory[] = await this.productsService.getReservedInventory(id, variantId, lang);

    return {
      data: reservedInventory.map(inventory => inventory.orderId)
    }
  }

  @Post()
  async addProduct(
    @Body() productDto: AdminAddOrUpdateProductDto,
    @ValidatedUser() user: DocumentType<User>,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminProductDto>> {
    const created = await this.productsService.createProduct(productDto, lang, user);

    return {
      data: plainToClass(AdminProductDto, created, { excludeExtraneousValues: true })
    };
  }

  @Post('media')
  async uploadMedia(@Request() request: FastifyRequest): Promise<AdminMediaDto> {
    const media = await this.productsService.uploadMedia(request);

    return plainToClass(AdminMediaDto, media, { excludeExtraneousValues: true });
  }

  @Post('action/fix-sort-order')
  async fixProductSortOrder(
    @Body() reorderDto: ProductReorderDto,
    @Query() spf: AdminSPFDto,
    @ValidatedUser() user: DocumentType<User>,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminProductListItemDto[]>> {

    await this.productsService.lockProductSortOrder(reorderDto, lang, user);
    return this.productsService.getAdminProductsList(spf, false);
  }

  @Post('action/unfix-sort-order')
  async unFixProductSortOrder(
    @Body() unfixDto: UnfixProductOrderDto,
    @Query() spf: AdminSPFDto,
    @ValidatedUser() user: DocumentType<User>,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminProductListItemDto[]>> {

    await this.productsService.unlockProductSortOrder(unfixDto, lang, user);
    return this.productsService.getAdminProductsList(spf, false);
  }

  @Put(':id')
  async updateProduct(
    @Param('id') productId: number,
    @Body() productDto: AdminAddOrUpdateProductDto,
    @ValidatedUser() user: DocumentType<User>,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminProductDto>> {
    const updated = await this.productsService.updateProduct(productId, productDto, lang, user);
    return {
      data: plainToClass(AdminProductDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Delete(':id')
  async deleteProduct(@Param('id') productId: number, @AdminLang() lang: Language): Promise<ResponseDto<AdminProductDto>> {
    const deleted = await this.productsService.deleteProduct(productId, lang);

    return {
      data: plainToClass(AdminProductDto, deleted, { excludeExtraneousValues: true })
    };
  }
}
