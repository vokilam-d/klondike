import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { WysiwygService } from './wysiwyg.service';
import { UserJwtGuard } from '../auth/guards/user-jwt.guard';

@UseGuards(UserJwtGuard)
@Controller('admin/wysiwyg')
export class WysiwygController {

  constructor(private readonly wysiwygService: WysiwygService) {
  }

  @Post('media')
  async uploadMedia(@Request() request: FastifyRequest): Promise<string> {
    return this.wysiwygService.uploadMedia(request);
  }
}
