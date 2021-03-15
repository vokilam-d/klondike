import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CategoryService } from '../../category/category.service';
import { ProductService } from '../../product/services/product.service';
import { BlogPostService } from '../../blog/services/blog-post.service';
import { EBannerItemType } from '../../shared/enums/banner-item-type.enum';
import { Language } from '../../shared/enums/language.enum';
import { AdminBannerItemDto } from '../../shared/dtos/admin/banner-item.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { Banner, BannerModel } from '../models/banner.model';
import { AdminUpdateBannerDto } from '../../shared/dtos/admin/update-banner.dto';

@Injectable()
export class BannerService {

  constructor(
    @InjectModel(Banner.name) private readonly bannerModel: ReturnModelType<typeof BannerModel>,
    @Inject(forwardRef(() => ProductService)) private readonly productService: ProductService,
    @Inject(forwardRef(() => CategoryService)) private readonly categoryService: CategoryService,
    @Inject(forwardRef(() => BlogPostService)) private readonly blogPostService: BlogPostService
  ) {
  }

  async createBannerItem(id: number, type: EBannerItemType, lang: Language): Promise<AdminBannerItemDto> {
    const item = new AdminBannerItemDto();

    item.id = id;
    item.type = type;

    switch (type) {
      case EBannerItemType.product:
        const product = await this.productService.getProductWithQtyById(id, lang);
        const productVariant = product.variants[0];

        item.media = productVariant.medias[0];
        item.slug = productVariant.slug;
        item.price = productVariant.price;
        item.oldPrice = productVariant.oldPrice;
        item.label = productVariant?.label;
        break;

      case EBannerItemType.category:
        const category = await this.categoryService.getCategoryById(id, lang);

        item.media = category.medias[0];
        item.slug = category.slug;
        break;

      case EBannerItemType.post:
        const post = await this.blogPostService.getBlogPost(id, lang);

        item.media = post.medias[0];
        item.slug = post.slug;
        break;
    }

    return item;
  }

  async updateBanner(bannerDto: AdminUpdateBannerDto, lang: Language): Promise<AdminBannerItemDto[]> {
    const banner = await this.bannerModel.findOne().exec();
    banner.bannerItems = bannerDto.bannerItems;
    await banner.save();

    return this.buildClientBanner(banner, lang);
  }

  async getBanner(lang: Language): Promise<AdminBannerItemDto[]> {
    const banner = await this.bannerModel.findOne().exec();
    return this.buildClientBanner(banner, lang);
  }

  async buildClientBanner(banner: Banner, lang: Language): Promise<AdminBannerItemDto[]> {
    const createdBanner = [];

    for (const bannerItem of banner.bannerItems) {
      const createdBannerItem = await this.createBannerItem(bannerItem.id, bannerItem.type, lang);
      createdBanner.push(createdBannerItem);
    }

    return createdBanner;
  }
}
