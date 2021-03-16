import { Injectable } from '@nestjs/common';
import { Order } from '../../order/models/order.model';

@Injectable()
export class BotService {

  async onNewOrder(order: Order): Promise<void> {
    console.log('on new order');
  }
}
