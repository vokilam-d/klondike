import { ClassSerializerInterceptor, Controller, Get, Post, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { TaxShiftDto } from '../../shared/dtos/admin/tax/tax-shift.dto';
import { TaxService } from '../services/tax.service';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/tax/shifts')
export class ShiftController {

  constructor(
    private readonly taxService: TaxService
  ) { }

  @Get('current')
  async getCurrentShift(): Promise<ResponseDto<TaxShiftDto>> {
    const shift = await this.taxService.getCurrentShift();

    return {
      data: shift
    };
  }

  @Post()
  async openShift(): Promise<ResponseDto<TaxShiftDto>> {
    const shift = await this.taxService.openShift();

    return {
      data: shift
    };
  }

  @Post('close')
  async closeShift(): Promise<ResponseDto<TaxShiftDto>> {
    const shift = await this.taxService.closeShift();

    return {
      data: shift
    };
  }
}
