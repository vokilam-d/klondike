import { Module } from '@nestjs/common';
import { Banner, BannerModel } from './models/banner.model';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminBannerController } from './controllers/admin-banner.controller';
import { ClientBannerController } from './controllers/client-banner.controller';
import { BannerService } from './services/banner.service';
import { ProductModule } from '../product/product.module';
import { CategoryModule } from '../category/category.module';
import { BlogModule } from '../blog/blog.module';


const bannerModel = {
  name: BannerModel.modelName,
  schema: BannerModel.schema,
  collection: Banner.collectionName
}

@Module({
  imports: [
    ProductModule,
    CategoryModule,
    BlogModule,
    MongooseModule.forFeature([bannerModel])
  ],
  controllers: [AdminBannerController, ClientBannerController],
  providers: [BannerService]
})
export class BannerModule {
}
