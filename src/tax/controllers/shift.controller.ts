import { ClassSerializerInterceptor, Controller, Get, Post, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { TaxShiftDto } from '../../shared/dtos/admin/tax/tax-shift.dto';
import { TaxService } from '../services/tax.service';
import { ValidatedUser } from '../../shared/decorators/validated-user.decorator';
import { User } from '../../user/models/user.model';

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
  async openShift(@ValidatedUser() user: User): Promise<ResponseDto<TaxShiftDto>> {
    const shift = await this.taxService.openShift(user);

    return {
      data: shift
    };
  }

  @Post('close')
  async closeShift(@ValidatedUser() user: User): Promise<ResponseDto<TaxShiftDto>> {
    const shift = await this.taxService.closeShift(user);

    return {
      data: shift
    };
  }
}
