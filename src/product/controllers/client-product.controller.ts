import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  forwardRef,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { ClientProductDto } from '../../shared/dtos/client/product.dto';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { ClientProductSPFDto } from '../../shared/dtos/client/product-spf.dto';
import { ClientProductListResponseDto } from '../../shared/dtos/client/product-list-response.dto';
import { AddProductQuickReviewDto } from '../../shared/dtos/client/add-product-quick-review.dto';
import { IpAddress } from '../../shared/decorators/ip-address.decorator';
import { ClientId } from '../../shared/decorators/client-id.decorator';
import { ProductQuickReviewService } from '../../reviews/product-review/product-quick-review.service';
import { AuthService } from '../../auth/services/auth.service';
import { ModuleRef } from '@nestjs/core';
import { parseClientProductId } from '../../shared/helpers/client-product-id';
import { ClientProductResponseDto } from '../../shared/dtos/client/product-response.dto';
import { CategoryService } from '../../category/category.service';
import { plainToClass } from 'class-transformer';
import { ClientLinkedCategoryDto } from '../../shared/dtos/client/linked-category.dto';
import { ClientLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';
import { ClientProductService } from '../services/client-product.service';
import { AdminProductService } from '../services/admin-product.service';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('products')
export class ClientProductController {
  constructor(
    @Inject(forwardRef(() => CategoryService)) private readonly categoryService: CategoryService,
    private readonly productService: ClientProductService,
    private readonly moduleRef: ModuleRef,
    private readonly quickReviewService: ProductQuickReviewService
  ) { }

  @Get('sdflksdf')
  async sdf() {
    const adm = this.moduleRef.get(AdminProductService, { strict: false });
    await adm.setSquare();
  }

  @Get()
  async findProducts(@Query() spf: ClientProductSPFDto, @ClientLang() lang: Language): Promise<ClientProductListResponseDto> {
    if (spf.lastAdded) {
      return this.productService.getClientProductListLastAdded(lang);
    } else if (spf.id) {
      return this.productService.getClientProductList(spf, lang);
    } else {
      return this.productService.getClientProductListWithFilters(spf, lang);
    }
  }

  @Get(':slug')
  async getProductBySlug(@Param('slug') slug: string, @ClientLang() lang: Language): Promise<ClientProductResponseDto> {
    const dto = await this.productService.getEnabledClientProductDtoBySlug(slug, lang);

    const lastBreadcrumb = dto.breadcrumbs[dto.breadcrumbs.length - 1];
    const categories = await this.categoryService.getClientSiblingCategories(lastBreadcrumb.id, lang);

    return {
      data: dto,
      categories: plainToClass(ClientLinkedCategoryDto, categories, { excludeExtraneousValues: true })
    }
  }

  @Post(':clientProductId/quick-reviews')
  async createQuickReview(@Param('clientProductId') clientProductId: string,
                          @Body() quickReviewDto: AddProductQuickReviewDto,
                          @Req() req,
                          @IpAddress() ipAddress: string | null,
                          @ClientId() clientId: string,
                          @ClientLang() lang: Language
  ): Promise<ResponseDto<ClientProductDto>> {

    const [productId, variantId] = parseClientProductId(clientProductId);

    const authService = this.moduleRef.get(AuthService, { strict: false });
    const customerId = await authService.getCustomerIdFromReq(req);

    await this.quickReviewService.createQuickReview(productId, quickReviewDto, ipAddress, clientId, customerId, lang);
    const productWithQty = await this.productService.getProductWithQtyById(productId, lang);
    const slug = productWithQty.variants.find(v => v._id.equals(variantId)).slug;
    const dto = await this.productService.transformToClientProductDto(productWithQty, slug, lang);

    return {
      data: dto
    };
  }

  @Post(':clientProductId/views-count')
  async incViewsCount(@Param('clientProductId') clientProductId: string): Promise<ResponseDto<null>> {

    const [productId, variantId] = parseClientProductId(clientProductId);
    await this.productService.incrementViewsCount(productId);

    return {
      data: null
    };
  }
}
