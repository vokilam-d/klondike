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

          for (const variant of dto.variants) {
            skus.add(variant.sku);
            slugs.add(variant.slug);
          }

          return skus.size === dto.variants.length && slugs.size === dto.variants.length;
        }
      }
    });
  };
}
