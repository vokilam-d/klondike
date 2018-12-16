import { Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
  }

  @Get('/api/test')
  async getTestData() {
    console.log('get test');
    return this.appService.getTest();
  }

  @Get('*')
  getHello(@Req() req, @Res() res) {
    console.log('get index');
    return this.appService.getHello(req, res);
  }
}
