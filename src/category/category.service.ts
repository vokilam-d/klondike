import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Category } from './models/category.model';
import { PageRegistryService } from '../page-registry/page-registry.service';
import { ProductService } from '../product/product.service';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import {
  AdminAddOrUpdateCategoryDto,
  AdminCategoriesTreeDto,
  AdminCategoryTreeItem
} from '../shared/dtos/admin/category.dto';
import { CounterService } from '../shared/counter/counter.service';
import { transliterate } from '../shared/helpers/transliterate.function';
import { plainToClass } from 'class-transformer';

@Injectable()
export class CategoryService {

  constructor(@InjectModel(Category.name) private readonly categoryModel: ReturnModelType<typeof Category>,
              private pageRegistryService: PageRegistryService,
              private counterService: CounterService,
              private productService: ProductService) {
  }

  async getCategoriesTree(): Promise<AdminCategoriesTreeDto> {
    const treeItems: AdminCategoryTreeItem[] = [];
    const childrenMap: { [parentId: number]: AdminCategoryTreeItem[] } = {};

    const found = await this.categoryModel.find().exec();
    found.forEach(category => {
      const item = {
        id: category.id,
        name: category.name,
        children: []
      };

      if (category.parentId === 0) {
        treeItems.push(item);
        return;
      }

      childrenMap[category.parentId] = childrenMap[category.parentId] || [];
      childrenMap[category.parentId].push(item);
    });

    const populateChildrenArray = (array: AdminCategoryTreeItem[]) => {
      array.forEach(arrayItem => {
        const children = childrenMap[arrayItem.id] || [];
        arrayItem.children.push(...children);

        populateChildrenArray(arrayItem.children);
      });
    };

    populateChildrenArray(treeItems);

    return new AdminCategoriesTreeDto({ categories: treeItems });
  }

  async getCategoryById(id: string | number): Promise<DocumentType<Category>> {
    id = parseInt(id as string);

    const found = await this.categoryModel.findById(id).exec();
    if (!found) {
      throw new NotFoundException(`Category with id '${id}' not found`);
    }

    return found;
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    const found = await this.categoryModel.findOne({ slug }).exec();
    if (!found) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    return found.toJSON();
  }

  async createCategory(category: AdminAddOrUpdateCategoryDto): Promise<Category> {
    category.slug = category.slug === '' ? transliterate(category.name) : category.slug;

    const duplicate = await this.categoryModel.findOne({ slug: category.slug, parentId: category.parentId }).exec();
    if (duplicate) {
      throw new BadRequestException(`Category with slug '${category.slug}' already exists`);
    }

    const newCategoryModel = new this.categoryModel(category);
    newCategoryModel.id = await this.counterService.getCounter(Category.collectionName);

    await newCategoryModel.save();

    this.createCategoryPageRegistry(newCategoryModel.slug);
    return plainToClass(Category, newCategoryModel.toJSON());
  }

  async updateCategory(categoryId: string | number, category: AdminAddOrUpdateCategoryDto): Promise<Category> {
    category.slug = category.slug === '' ? transliterate(category.name) : category.slug;

    const found = await this.getCategoryById(categoryId);
    const oldSlug = found.slug;

    Object.keys(category).forEach(key => {
      if (category[key] !== undefined && key !== 'id') {
        found[key] = category[key];
      }
    });

    const saved = await found.save();

    if (oldSlug !== category.slug) {
      this.updateCategoryPageRegistry(found.slug, category.slug);
    }

    return saved.toJSON();
  }

  async deleteCategory(categoryId: number): Promise<DocumentType<Category>> {
    const deleted = await this.categoryModel.findByIdAndDelete(categoryId).exec();
    if (deleted === null) {
      throw new NotFoundException(`Category with id '${categoryId}' not found`);
    }

    this.deleteCategoryPageRegistry(deleted.slug);

    return deleted.toJSON();
  }

  async getCategoryItems(categoryId: number) {
    const products = await this.productService.findProductsByCategoryId(categoryId);
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
