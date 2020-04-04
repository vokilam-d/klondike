import { Controller, Post, Request, Response, UseGuards } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';
import { WysiwygService } from './wysiwyg.service';
import { UserJwtGuard } from '../auth/services/guards/user-jwt.guard';

@UseGuards(UserJwtGuard)
@Controller('admin/wysiwyg')
export class WysiwygController {

  constructor(private readonly wysiwygService: WysiwygService) {
  }

  @Post('media')
  async uploadMedia(@Request() request: FastifyRequest, @Response() reply: FastifyReply<ServerResponse>) {
    const url = await this.wysiwygService.uploadMedia(request);

    reply.status(201).send(url);
  }
}
