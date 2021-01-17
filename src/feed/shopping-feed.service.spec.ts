import { Test, TestingModule } from '@nestjs/testing';
import { ShoppingFeedService } from './shopping-feed.service';

describe('GoogleService', () => {
  let service: ShoppingFeedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShoppingFeedService],
    }).compile();

    service = module.get<ShoppingFeedService>(ShoppingFeedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
