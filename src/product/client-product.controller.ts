import {
  Body,
  ClassSerializerInterceptor,
  Controller, forwardRef,
  Get, Inject,
  Param,
  Post,
  Query,
  Req,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { ProductService } from './product.service';
import { ClientProductDto } from '../shared/dtos/client/product.dto';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { ClientProductSPFDto } from '../shared/dtos/client/product-spf.dto';
import { ClientProductListResponseDto } from '../shared/dtos/client/product-list-response.dto';
import { AddProductQuickReviewDto } from '../shared/dtos/client/add-product-quick-review.dto';
import { IpAddress } from '../shared/decorators/ip-address.decorator';
import { ClientId } from '../shared/decorators/client-id.decorator';
import { ProductQuickReviewService } from '../reviews/product-review/product-quick-review.service';
import { AuthService } from '../auth/services/auth.service';
import { ModuleRef } from '@nestjs/core';
import { parseClientProductId } from '../shared/helpers/client-product-id';
import { ClientProductResponseDto } from '../shared/dtos/client/product-response.dto';
import { CategoryService } from '../category/category.service';
import { plainToClass } from 'class-transformer';
import { ClientLinkedCategoryDto } from '../shared/dtos/client/linked-category.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('products')
export class ClientProductController {
  constructor(@Inject(forwardRef(() => CategoryService)) private readonly categoryService: CategoryService,
              private readonly productService: ProductService,
              private readonly moduleRef: ModuleRef,
              private readonly quickReviewService: ProductQuickReviewService) {
  }

  @Get()
  async findProducts(@Query() spf: ClientProductSPFDto): Promise<ClientProductListResponseDto> {
    if (spf.autocomplete) {
      return this.productService.getClientProductListAutocomplete(spf.q);
    } else if (spf.lastAdded) {
      return this.productService.getClientProductListLastAdded();
    } else if (spf.id) {
      return this.productService.getClientProductList(spf);
    } else {
      return this.productService.getClientProductListWithFilters(spf);
    }
  }

  @Get(':slug')
  async getProductBySlug(@Param('slug') slug: string): Promise<ClientProductResponseDto> {
    const dto = await this.productService.getEnabledClientProductDtoBySlug(slug);

    const lastBreadcrumb = dto.breadcrumbs[dto.breadcrumbs.length - 1];
    const categories = await this.categoryService.getClientLinkedCategories(lastBreadcrumb.id)

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
                          @ClientId() clientId: string
  ): Promise<ResponseDto<ClientProductDto>> {

    const [productId, variantId] = parseClientProductId(clientProductId);

    const authService = this.moduleRef.get(AuthService, { strict: false });
    const customerId = await authService.getCustomerIdFromReq(req);

    await this.quickReviewService.createQuickReview(productId, quickReviewDto, ipAddress, clientId, customerId);
    const productWithQty = await this.productService.getProductWithQtyById(productId);
    const slug = productWithQty.variants.find(v => v._id.equals(variantId)).slug;
    const dto = await this.productService.transformToClientProductDto(productWithQty, slug);

    return {
      data: dto
    };
  }
}
