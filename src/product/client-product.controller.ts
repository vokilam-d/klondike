import { ClassSerializerInterceptor, Controller, Get, Param, Query, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductService } from './product.service';
import { ClientProductDto } from '../shared/dtos/client/product.dto';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { ClientProductSPFDto } from '../shared/dtos/client/product-spf.dto';
import { ClientProductListResponseDto } from '../shared/dtos/client/product-list-response.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('products')
export class ClientProductController {
  constructor(private readonly productService: ProductService) {
  }

  @Get()
  async findProducts(@Query() spf: ClientProductSPFDto): Promise<ClientProductListResponseDto> {
    return this.productService.getClientProductListWithFilters(spf);
  }

  @Get(':slug')
  async getProductBySlug(@Param('slug') slug: string): Promise<ResponseDto<ClientProductDto>> {
    const dto = await this.productService.getClientProductDtoBySlug(slug);

    return {
      data: dto
    }
  }
}
