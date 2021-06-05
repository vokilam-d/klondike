import { Injectable } from '@nestjs/common';
import { CategoryService } from '../../category/category.service';
import { AdminProductService } from '../../product/services/admin-product.service';
import { BlogPostService } from '../../blog/services/blog-post.service';
import { EBannerItemType } from '../../shared/enums/banner-item-type.enum';
import { Language } from '../../shared/enums/language.enum';
import { AdminBannerItemDto } from '../../shared/dtos/admin/banner-item.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { Banner, BannerModel } from '../models/banner.model';
import { AdminUpdateBannerDto } from '../../shared/dtos/admin/update-banner.dto';
import { AdminCreateBannerItemDto } from '../../shared/dtos/admin/create-banner-item.dto';
import { FastifyRequest } from 'fastify';
import { Media } from '../../shared/models/media.model';
import { MediaService } from '../../shared/services/media/media.service';
import { ProductLabelTypeEnum } from '../../shared/enums/product-label-type.enum';
import { __ } from '../../shared/helpers/translate/translate.function';

@Injectable()
export class BannerService {

  constructor(
    @InjectModel(Banner.name) private readonly bannerModel: ReturnModelType<typeof BannerModel>,
    private readonly productService: AdminProductService,
    private readonly categoryService: CategoryService,
    private readonly blogPostService: BlogPostService,
    private readonly mediaService: MediaService
  ) {
  }

  async createBannerItem(createBannerItemDto: AdminCreateBannerItemDto, lang: Language): Promise<AdminBannerItemDto> {
    const item = new AdminBannerItemDto();

    item.type = createBannerItemDto.type;

    switch (createBannerItemDto.type) {
      case EBannerItemType.product:
        const product = await this.productService.getProductWithQtyById(createBannerItemDto.id, lang);
        const productVariant = product.variants[0];

        item.id = createBannerItemDto.id;
        item.media = productVariant.medias[0];
        item.slug = productVariant.slug;
        item.price = productVariant.priceInDefaultCurrency;
        item.oldPrice = productVariant.oldPriceInDefaultCurrency;
        item.label = {
          type: productVariant.label === ProductLabelTypeEnum.Empty ? null : productVariant.label,
          text: productVariant.label === ProductLabelTypeEnum.Empty ? null : __(productVariant.label, lang)
        };
        break;

      case EBannerItemType.category:
        const category = await this.categoryService.getCategoryById(createBannerItemDto.id, lang);

        item.id = createBannerItemDto.id;
        item.media = category.medias[0];
        item.slug = category.slug;
        break;

      case EBannerItemType.post:
        const post = await this.blogPostService.getBlogPost(createBannerItemDto.id, lang);

        item.id = createBannerItemDto.id;
        item.media = post.featuredMedia;
        item.slug = post.slug;
        break;

      case EBannerItemType.manual:
        item.slug = createBannerItemDto.slug;
        item.media = createBannerItemDto.media;
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
      const createdBannerItem = await this.createBannerItem(bannerItem, lang);
      createdBanner.push(createdBannerItem);
    }

    return createdBanner;
  }

  async uploadMedia(request: FastifyRequest): Promise<Media> {
    return this.mediaService.upload(request, Banner.collectionName);
  }
}
