import { Injectable, NotFoundException } from '@nestjs/common';
import { BackendCategory } from './models/category.model';
import { BackendPageRegistryService } from '../page-registry/page-registry.service';
import { Types } from 'mongoose';
import { BackendProductService } from '../product/product.service';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';

@Injectable()
export class BackendCategoryService {

  constructor(@InjectModel(BackendCategory.name) private readonly categoryModel: ReturnModelType<typeof BackendCategory>,
              private pageRegistryService: BackendPageRegistryService,
              private productService: BackendProductService) {
  }

  async getCategory(slug: string) {
    const category = await this.categoryModel.findOne({slug}).exec();

    if (!category) {
      throw new NotFoundException(`Category with url '${slug}' not found`);
    }

    return category;
  }

  async getCategoryById(id: Types.ObjectId) {
    const category = await this.categoryModel.findOne({_id: id}).exec();

    if (!category) {
      throw new NotFoundException(`Category with url '${id}' not found`);
    }

    return category;
  }

  async createCategory(category: BackendCategory): Promise<BackendCategory> {
    const newCategory = new BackendCategory();

    Object.keys(category).forEach(key => {
      newCategory[key] = category[key];
    });

    const result = await this.categoryModel.create(newCategory);

    this.createCategoryPageRegistry(result.slug);
    return result.toJSON();
  }

  async updateCategory(objectId: Types.ObjectId, oldCategory: BackendCategory, newCategory: BackendCategory): Promise<BackendCategory> {
    const oldSlug = oldCategory.slug;

    Object.keys(newCategory).forEach(key => {
      oldCategory[key] = newCategory[key];
    });

    const updated = await this.categoryModel.findOneAndUpdate(
      { _id: objectId },
      oldCategory,
      { new: true }
    ).exec();

    if (oldSlug !== updated.slug) {
      this.updateCategoryPageRegistry(oldSlug, updated.slug);
    }

    return updated.toJSON();
  }

  async deleteCategory(objectId: Types.ObjectId) {
   const deleted = await this.categoryModel.findOneAndDelete({ _id: objectId }).exec();

   if (!deleted) {
     throw new NotFoundException(`No such category with id '${objectId}'`);
   }

   this.deleteCategoryPageRegistry(deleted.slug);
   return deleted.toJSON();
  }

  findOne(filter = {}) {
    return this.categoryModel.findOne(filter).exec();
  }

  findById(id) {
    return this.categoryModel.findById(id).exec();
  }

  findAll(filter = {}) {
    return this.categoryModel.find(filter).exec();
  }

  async getCategoryItems(categoryId: Types.ObjectId, query: any) {
    const products = await this.productService.findProductsByCategoryId(categoryId, query);
    return products;
  }

  private createCategoryPageRegistry(slug: string) {
    return this.pageRegistryService.createPageRegistry({
      slug,
      type: 'category'
    });
  }

  private updateCategoryPageRegistry(oldSlug: string, newSlug: string) {
    return this.pageRegistryService.updatePageRegistry(oldSlug, {
      slug: newSlug,
      type: 'category'
    });
  }

  private deleteCategoryPageRegistry(slug: string) {
    return this.pageRegistryService.deletePageRegistry(slug);
  }
}
