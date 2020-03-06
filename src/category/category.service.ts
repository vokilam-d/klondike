import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Category } from './models/category.model';
import { PageRegistryService } from '../page-registry/page-registry.service';
import { ProductService } from '../product/product.service';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { AdminAddOrUpdateCategoryDto } from '../shared/dtos/admin/category.dto';
import { CounterService } from '../shared/counter/counter.service';
import { transliterate } from '../shared/helpers/transliterate.function';
import { plainToClass } from 'class-transformer';
import { ClientSession } from 'mongoose';
import { CategoryTreeItem } from '../shared/dtos/shared/category.dto';
import { ClientProductListItemDto } from '../shared/dtos/client/product-list-item.dto';
import { ClientSortingPaginatingFilterDto } from '../shared/dtos/client/spf.dto';
import { ResponseDto } from '../shared/dtos/shared/response.dto';

@Injectable()
export class CategoryService {

  constructor(@InjectModel(Category.name) private readonly categoryModel: ReturnModelType<typeof Category>,
              private pageRegistryService: PageRegistryService,
              private counterService: CounterService,
              @Inject(forwardRef(() => ProductService)) private productService: ProductService) {
  }

  async getCategoriesTree(): Promise<CategoryTreeItem[]> {
    const treeItems: CategoryTreeItem[] = [];
    const childrenMap: { [parentId: number]: CategoryTreeItem[] } = {};

    const found = await this.categoryModel.find().exec();
    found.forEach(category => {
      const item = {
        id: category.id,
        name: category.name,
        slug: category.slug,
        children: []
      };

      if (category.parentId === 0) {
        treeItems.push(item);
        return;
      }

      childrenMap[category.parentId] = childrenMap[category.parentId] || [];
      childrenMap[category.parentId].push(item);
    });

    const populateChildrenArray = (array: CategoryTreeItem[]) => {
      array.forEach(arrayItem => {
        const children = childrenMap[arrayItem.id] || [];
        arrayItem.children.push(...children);

        populateChildrenArray(arrayItem.children);
      });
    };

    populateChildrenArray(treeItems);

    return treeItems;
  }

  async getCategoryById(id: string | number): Promise<DocumentType<Category>> {
    id = parseInt(id as string);

    const found = await this.categoryModel.findById(id).exec();
    if (!found) {
      throw new NotFoundException(`Category with id '${id}' not found`);
    }

    return found;
  }

  async getCategoryBySlug(slug: string): Promise<Category> { // todo cache
    const found = await this.categoryModel.findOne({ slug }).exec();
    if (!found) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    return found.toJSON();
  }

  async createCategory(category: AdminAddOrUpdateCategoryDto, migrate?: any): Promise<Category> {
    category.slug = category.slug === '' ? transliterate(category.name) : category.slug;

    const duplicate = await this.categoryModel.findOne({ slug: category.slug, parentId: category.parentId }).exec();
    if (duplicate) {
      throw new BadRequestException(`Category with slug '${category.slug}' already exists in parent with ID '${category.parentId}'`);
    }

    const session = await this.categoryModel.db.startSession();
    session.startTransaction();

    try {
      const newCategoryModel = new this.categoryModel(category);
      if (!migrate) {
        newCategoryModel.id = await this.counterService.getCounter(Category.collectionName, session);
      }

      await newCategoryModel.save({ session });
      await this.createCategoryPageRegistry(newCategoryModel.slug, session);
      await session.commitTransaction();

      return plainToClass(Category, newCategoryModel.toJSON());
    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      await session.endSession();
    }
  }

  async updateCategory(categoryId: number, categoryDto: AdminAddOrUpdateCategoryDto): Promise<Category> {
    categoryDto.slug = categoryDto.slug === '' ? transliterate(categoryDto.name) : categoryDto.slug;

    const found = await this.getCategoryById(categoryId);
    const oldSlug = found.slug;
    const oldName = found.name;

    Object.keys(categoryDto).forEach(key => {
      if (categoryDto[key] !== undefined && key !== 'id') {
        found[key] = categoryDto[key];
      }
    });

    const session = await this.categoryModel.db.startSession();
    session.startTransaction();

    try {
      const saved = await found.save({ session });
      if (oldSlug !== categoryDto.slug) {
        await this.updateCategoryPageRegistry(oldSlug, categoryDto.slug, session);
      }
      if (oldSlug !== categoryDto.slug || oldName !== categoryDto.name) {
        await this.productService.updateBreadcrumbs({ id: categoryId, name: categoryDto.name, slug: categoryDto.slug}, session);
      }

      await session.commitTransaction();
      return saved.toJSON();

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async deleteCategory(categoryId: number): Promise<DocumentType<Category>> {
    const session = await this.categoryModel.db.startSession();
    session.startTransaction();

    try {
      const deleted = await this.categoryModel.findByIdAndDelete(categoryId).session(session).exec();
      if (deleted === null) {
        throw new NotFoundException(`Category with id '${categoryId}' not found`);
      }

      await this.productService.removeCategoryId(categoryId, session);
      await this.deleteCategoryPageRegistry(deleted.slug, session);
      await session.commitTransaction();

      return deleted.toJSON();
    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async getCategoryItems(slug: string, spf: ClientSortingPaginatingFilterDto): Promise<ResponseDto<ClientProductListItemDto[]>> {
    const category = await this.getCategoryBySlug(slug);
    return this.productService.getClientProductListByCategoryId(category.id, spf);
  }

  private createCategoryPageRegistry(slug: string, session: ClientSession) {
    return this.pageRegistryService.createPageRegistry({
      slug,
      type: 'category'
    }, session);
  }

  private updateCategoryPageRegistry(oldSlug: string, newSlug: string, session: ClientSession) {
    return this.pageRegistryService.updatePageRegistry(oldSlug, {
      slug: newSlug,
      type: 'category'
    }, session);
  }

  private deleteCategoryPageRegistry(slug: string, session: ClientSession) {
    return this.pageRegistryService.deletePageRegistry(slug, session);
  }

  async updateCounter() {
    const lastCategory = await this.categoryModel.findOne().sort('-_id').exec();
    return this.counterService.setCounter(Category.collectionName, lastCategory.id);
  }
}
