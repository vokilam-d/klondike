import { Test, TestingModule } from '@nestjs/testing';
import { GoogleShoppingFeedService } from './google-shopping-feed.service';

describe('GoogleService', () => {
  let service: GoogleShoppingFeedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleShoppingFeedService],
    }).compile();

    service = module.get<GoogleShoppingFeedService>(GoogleShoppingFeedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
