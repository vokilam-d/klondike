import { createParamDecorator } from '@nestjs/common';
import * as requestIp from 'request-ip';

export const IpAddress = createParamDecorator((data, input) => {
  if (input.clientIp) {
    return input.clientIp;
  } else {
    return requestIp.getClientIp(input);
  }
});
