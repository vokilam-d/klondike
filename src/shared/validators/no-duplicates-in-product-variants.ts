import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { AdminAddOrUpdateProductDto } from '../dtos/admin/product.dto';

export function NoDuplicatesInProductVariants(validationOptions: ValidationOptions = {}) {

  validationOptions = {
    message: 'Product variants must have unique SKU and URL keys',
    ...validationOptions
  };

  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'NoDuplicatesInProductVariants',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        ...validationOptions,
        validationError: {
          target: true,
          value: true
        }
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          const dto = args.object as AdminAddOrUpdateProductDto;
          const skus = new Set();
          const slugs = new Set();
          let skusCount: number = 0;
          let slugsCount: number = 0;

          for (const variant of dto.variants) {
            if (variant.sku) {
              skus.add(variant.sku);
              skusCount++;
            }
            if (variant.slug) {
              slugs.add(variant.slug);
              slugsCount++;
            }
          }

          return skus.size === skusCount && slugs.size === slugsCount;
        }
      }
    });
  };
}
