import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post, Put,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { UserService } from './user.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { AddOrUpdateUserDto, UserDto } from '../shared/dtos/admin/user.dto';
import { AuthService } from '../auth/services/auth.service';
import { DocumentType } from '@typegoose/typegoose';
import { User } from './models/user.model';
import { plainToClass } from 'class-transformer';
import { UserJwtGuard } from '../auth/services/guards/user-jwt.guard';
import { LoginDto } from '../shared/dtos/shared-dtos/login.dto';
import { FastifyReply } from 'fastify';
import { ServerResponse } from 'http';
import { UserLocalGuard } from '../auth/services/guards/user-local.guard';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/user')
export class UserController {

  constructor(private readonly userService: UserService,
              private readonly authService: AuthService) {
  }

  @UseGuards(UserJwtGuard)
  @Get()
  async getUser(@Req() req): Promise<ResponseDto<UserDto>> {
    const user: DocumentType<User> = await this.authService.getUserFromReq(req);
    const dto = plainToClass(UserDto, user.toJSON(), { excludeExtraneousValues: true });

    return {
      data: dto
    };
  }

  @UseGuards(UserJwtGuard)
  @Get('list')
  async getAllUsers(@Req() req): Promise<ResponseDto<UserDto[]>> {
    const users = await this.userService.getAllUsers();

    return {
      data: plainToClass(UserDto, users, { excludeExtraneousValues: true })
    };
  }

  // @UseGuards(UserJwtGuard)
  @Post()
  async addNewUser(@Body() addUserDto: AddOrUpdateUserDto): Promise<ResponseDto<UserDto>> {
    const newUser = await this.userService.addNewUser(addUserDto);

    return {
      data: plainToClass(UserDto, newUser, { excludeExtraneousValues: true })
    };
  }

  /**
   * @returns ResponseDto<UserDto>
   */
  @UseGuards(UserLocalGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req, @Res() res: FastifyReply<ServerResponse>) {
    const user: DocumentType<User> = req.user;
    const userDto = plainToClass(UserDto, user, { excludeExtraneousValues: true });

    return this.authService.loginUser(userDto, res);
  }

  @Post('logout')
  async logout(@Res() res: FastifyReply<ServerResponse>) {
    return this.authService.logoutUser(res);
  }

  // @UseGuards(UserJwtGuard)
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: AddOrUpdateUserDto): Promise<ResponseDto<UserDto>> {
    const updated = await this.userService.updateUser(id, updateUserDto);

    return {
      data: plainToClass(UserDto, updated, { excludeExtraneousValues: true })
    };
  }

  // @UseGuards(UserJwtGuard)
  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<ResponseDto<UserDto>> {
    const updated = await this.userService.deleteUser(id);

    return {
      data: plainToClass(UserDto, updated, { excludeExtraneousValues: true })
    }
  }
}
