import { Test, TestingModule } from '@nestjs/testing';
import { AutocompleteService } from './autocomplete.service';

describe('AutocompleteService', () => {
  let service: AutocompleteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AutocompleteService],
    }).compile();

    service = module.get<AutocompleteService>(AutocompleteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
