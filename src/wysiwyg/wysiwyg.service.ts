import { Injectable } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { MediaService } from '../shared/services/media/media.service';

@Injectable()
export class WysiwygService {
  constructor(private readonly mediaService: MediaService) {
  }

  async uploadMedia(request: FastifyRequest): Promise<string> {
    const uploaded = await this.mediaService.upload(request, 'wysiwyg');
    return uploaded.variantsUrls.large;
  }
}
