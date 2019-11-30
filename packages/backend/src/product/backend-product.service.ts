import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BackendProduct } from './models/product.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { BackendInventoryService } from '../inventory/backend-inventory.service';
import { BackendPageRegistryService } from '../page-registry/page-registry.service';
import { InjectModel } from '@nestjs/mongoose';
import { AdminAddOrUpdateProductDto } from '../shared/dtos/admin/product.dto';
import { transliterate } from '../shared/helpers/transliterate.function';
import { BackendCounterService } from '../shared/counter/counter.service';
import { FastifyRequest } from 'fastify';
import { BackendMediaService } from '../shared/media-uploader/media-uploader/backend-media.service';
import { BackendMedia } from '../shared/models/media.model';
import { MediaDto } from '../shared/dtos/admin/media.dto';

const MEDIA_DIR_NAME = 'product';

@Injectable()
export class BackendProductService {

  constructor(@InjectModel(BackendProduct.name) private readonly productModel: ReturnModelType<typeof BackendProduct>,
              private readonly inventoryService: BackendInventoryService,
              private readonly counterService: BackendCounterService,
              private readonly mediaService: BackendMediaService,
              private readonly pageRegistryService: BackendPageRegistryService) {
  }

  async getProducts(): Promise<BackendProduct[]> {
    const products = await this.productModel.find().exec();

    return products.map(p => p.toJSON());
  }

  async getProductById(id: number): Promise<DocumentType<BackendProduct>> {
    const found = await this.productModel.findById(id).exec();
    if (!found) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }

    return found;
  }

  async getProductBySku(sku: string): Promise<DocumentType<BackendProduct>> {
    const found = await this.productModel.findOne({ sku }).exec();
    if (!found) {
      throw new NotFoundException(`Product with sku '${sku}' not found`);
    }

    return found;
  }

  async createProduct(productDto: AdminAddOrUpdateProductDto): Promise<BackendProduct> {
    productDto.slug = productDto.slug === '' ? transliterate(productDto.name) : productDto.slug;

    const duplicateSlug = await this.productModel.findOne({ slug: productDto.slug }).exec();
    if (duplicateSlug) {
      throw new BadRequestException(`Product with slug '${productDto.slug}' already exists`);
    }

    const duplicateSku = await this.productModel.findOne({ sku: productDto.sku }).exec();
    if (duplicateSku) {
      throw new BadRequestException(`Product with sku '${productDto.sku}' already exists`);
    }

    const newProductModel = new this.productModel(productDto);
    newProductModel.id = await this.counterService.getCounter(BackendProduct.collectionName);
    newProductModel.medias = await this.saveTmpMedias(productDto.medias);
    await newProductModel.save();

    await this.inventoryService.createInventory(newProductModel.sku, newProductModel.id, productDto.qty);
    this.createProductPageRegistry(newProductModel.slug);

    return newProductModel.toJSON();
  }

  async updateProduct(productId: number, productDto: AdminAddOrUpdateProductDto): Promise<BackendProduct> {
    productDto.slug = productDto.slug === '' ? transliterate(productDto.name) : productDto.slug;

    const found = await this.getProductById(productId);
    const hasSlugChanged = found.slug !== productDto.slug;

    const savedMedias: BackendMedia[] = [];
    const tmpMedias: MediaDto[] = [];
    const mediasToDelete: BackendMedia[] = [];

    productDto.medias.forEach(media => {
      const isTmpMedia = media.variantsUrls.original.includes('/tmp/');
      if (isTmpMedia) {
        tmpMedias.push(media);
      } else {
        savedMedias.push(media as BackendMedia);
      }
    });

    found.medias.forEach(media => {
      const isMediaInDto = savedMedias.find(mediaDto => mediaDto.variantsUrls.original === media.variantsUrls.original);
      if (!isMediaInDto) {
        mediasToDelete.push(media);
      }
    });

    Object.keys(productDto)
      .filter(key => key !== 'id')
      .forEach(key => {
        found[key] = productDto[key];
      });

    found.medias = [...savedMedias, ...await this.saveTmpMedias(tmpMedias)];
    const saved = await found.save();

    if (hasSlugChanged) {
      this.updateProductPageRegistry(found.slug, productDto.slug);
    }
    await this.deleteMedias(mediasToDelete);
    await this.inventoryService.setInventoryQty(saved.sku, productDto.qty);

    return saved.toJSON();
  }

  async getProductQty(product: BackendProduct): Promise<number> {
    const inventory = await this.inventoryService.getInventory(product.sku);
    return inventory.qty;
  }

  async deleteProduct(productId: number): Promise<BackendProduct> {
    const deleted = await this.productModel.findByIdAndDelete(productId).exec();
    if (!deleted) {
      throw new NotFoundException(`No product with id '${productId}'`);
    }

    await this.inventoryService.deleteInventory(productId);
    await this.deleteMedias(deleted.medias);
    this.deleteProductPageRegistry(deleted.slug);

    return deleted;
  }

  uploadMedia(request: FastifyRequest): Promise<BackendMedia> {
    return this.mediaService.upload(request, MEDIA_DIR_NAME);
  }

  private async saveTmpMedias(mediaDtos: MediaDto[]): Promise<BackendMedia[]> {
    const medias = [];
    for (let mediaDto of mediaDtos) {
      medias.push(await this.mediaService.saveTmpMedia(MEDIA_DIR_NAME, mediaDto));
    }

    return medias;
  }

  private async deleteMedias(medias: BackendMedia[]): Promise<void> {
    for (const media of medias) {
      await this.mediaService.delete(media, MEDIA_DIR_NAME);
    }
  }

  findProductsByCategoryId(categoryId: number) {
    return this.productModel.find(
      {
        categoryIds: categoryId
      },
    ).exec();
  }

  private createProductPageRegistry(slug: string) {
    return this.pageRegistryService.createPageRegistry({
      slug,
      type: 'product'
    });
  }

  private updateProductPageRegistry(oldSlug: string, newSlug: string) {
    return this.pageRegistryService.updatePageRegistry(oldSlug, {
      slug: newSlug,
      type: 'product'
    });
  }

  private deleteProductPageRegistry(slug: string) {
    return this.pageRegistryService.deletePageRegistry(slug);
  }
}
