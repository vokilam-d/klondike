import { Body, ClassSerializerInterceptor, Controller, Get, Param, Post, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { TaxService } from '../services/tax.service';
import { TaxReceiptDto } from '../../shared/dtos/admin/tax/tax-receipt.dto';
import { TaxReceiptSellDto } from '../../shared/dtos/admin/tax/tax-receipt-sell.dto';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/tax/receipts')
export class ReceiptController {

  constructor(
    private readonly taxService: TaxService
  ) { }

  @Get(':id')
  async getReceipt(@Param('id') id: string): Promise<ResponseDto<TaxReceiptDto>> {
    const receipt = await this.taxService.getReceipt(id);

    return {
      data: receipt
    };
  }

  @Post()
  async createReceipt(@Body() createReceiptDto: TaxReceiptSellDto): Promise<ResponseDto<TaxReceiptDto>> {
    const receipt = await this.taxService.createReceipt(createReceiptDto);

    return {
      data: receipt
    };
  }
}
