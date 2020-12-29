import { Injectable } from '@nestjs/common';
import { ProductService } from '../product/services/product.service';
import { AutocompleteItemDto } from '../shared/dtos/client/autocomplete-item.dto';
import { CategoryService } from '../category/category.service';
import { AdminSPFDto } from '../shared/dtos/admin/spf.dto';
import { AutocompleteItemType } from '../shared/enums/autocomplete-item-type.enum';
import { Language } from '../shared/enums/language.enum';

@Injectable()
export class AutocompleteService {

  constructor(private readonly productService: ProductService,
              private readonly categoryService: CategoryService
  ) { }

  async findByQuery(query: string, lang: Language): Promise<AutocompleteItemDto[]> {
    const items: AutocompleteItemDto[] = [];

    const spf = new AdminSPFDto();
    spf.limit = 3;
    const categories = await this.categoryService.searchEnabledByName(spf, query, lang);
    const products = await this.productService.getClientProductListAutocomplete(query, lang);

    for (const category of categories) {
      items.push({
        name: category.name[lang],
        slug: category.slug,
        mediaUrl: category.medias[0]?.variantsUrls.small,
        type: AutocompleteItemType.Category
      });
    }

    for (const product of products) {
      items.push({
        name: product.name,
        slug: product.slug,
        mediaUrl: product.mediaUrl,
        type: AutocompleteItemType.Product
      });

      if (items.length >= 5) { break; }
    }

    return items;
  }
}
