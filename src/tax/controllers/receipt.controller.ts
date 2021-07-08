import { Body, ClassSerializerInterceptor, Controller, Get, Param, Post, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { TaxService } from '../services/tax.service';
import { TaxReceiptDto } from '../../shared/dtos/admin/tax/tax-receipt.dto';
import { AdminLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';
import { ValidatedUser } from '../../shared/decorators/validated-user.decorator';
import { User } from '../../user/models/user.model';
import { TaxReceiptRepresentationType } from '../../shared/enums/tax/tax-receipt-representation-type.enum';

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

  @Get(':id/representation-url/:type')
  async getReceiptRepresentationUrl(
    @Param('id') receiptId: string,
    @Param('type') representationType: TaxReceiptRepresentationType
  ): Promise<ResponseDto<string>> {
    const url = await this.taxService.getReceiptRepresentationUrl(receiptId, representationType);

    return {
      data: url
    };
  }

  @Post('orders/:orderId')
  async createReceipt(
    @Param('orderId') orderId: string,
    @AdminLang() lang: Language,
    @ValidatedUser() user: User
  ): Promise<ResponseDto<TaxReceiptDto>> {
    const receipt = await this.taxService.createReceipt(orderId, lang, user);

    return {
      data: receipt
    };
  }
}
