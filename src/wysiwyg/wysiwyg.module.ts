import { Module } from '@nestjs/common';
import { WysiwygController } from './wysiwyg.controller';
import { WysiwygService } from './wysiwyg.service';

@Module({
  controllers: [WysiwygController],
  providers: [WysiwygService]
})
export class WysiwygModule {}
