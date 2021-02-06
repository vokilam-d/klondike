import { Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AdminMediaDto } from './media.dto';
import { AdminProductSelectedAttributeDto } from './product-selected-attribute.dto';
import { transliterate } from '../../helpers/transliterate.function';
import { CurrencyCodeEnum } from '../../enums/currency.enum';
import { ProductVariantWithQty } from '../../../product/models/product-with-qty.model';
import { AdminLinkedProductDto } from './linked-product.dto';
import { TrimString } from '../../decorators/trim-string.decorator';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';
import { AdminMetaTagsDto } from './meta-tags.dto';
import { ProductLabelTypeEnum } from '../../enums/product-label-type.enum';
import { clientDefaultLanguage } from '../../constants';

type PickedVariant = Pick<ProductVariantWithQty, 'name' | 'sku' | 'vendorCode' | 'gtin' | 'slug' | 'attributes' | 'isEnabled' | 'price'
  | 'oldPrice' | 'currency' | 'priceInDefaultCurrency' | 'oldPriceInDefaultCurrency' | 'medias' | 'fullDescription' | 'shortDescription'
  | 'metaTags' | 'qtyInStock' | 'isDiscountApplicable' | 'salesCount' | 'isIncludedInShoppingFeed' | 'googleAdsProductTitle'
  | 'relatedProducts' | 'crossSellProducts'>;
type VariantStringProps = Record<keyof Pick<ProductVariantWithQty, 'id'>, string>;

export class AdminAddOrUpdateProductVariantDto implements PickedVariant, VariantStringProps {
  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id: string;

  @Expose()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;

  @Expose()
  sku: string;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  vendorCode: string;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  gtin: string;

  @Expose()
  @IsString()
  @TrimString()
  @Transform((slug, variant: AdminAddOrUpdateProductVariantDto) => transliterate(slug || variant.name[clientDefaultLanguage]))
  slug: string;

  @IsBoolean()
  @IsOptional()
  createRedirect: boolean;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminProductSelectedAttributeDto)
  attributes: AdminProductSelectedAttributeDto[];

  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @Transform(price => parseFloat(price))
  @IsNumber()
  price: number;

  @Expose()
  @IsOptional()
  @Transform(oldPrice => oldPrice ? parseFloat(oldPrice) : oldPrice)
  @IsNumber()
  oldPrice: number;

  @Expose()
  @IsEnum(CurrencyCodeEnum)
  currency: CurrencyCodeEnum;

  @Expose()
  @IsOptional()
  @IsNumber()
  priceInDefaultCurrency: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  oldPriceInDefaultCurrency: number;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminMediaDto)
  medias: AdminMediaDto[];

  @Expose()
  @Type(() => MultilingualTextDto)
  fullDescription: MultilingualTextDto;

  @Expose()
  @Type(() => MultilingualTextDto)
  shortDescription: MultilingualTextDto;

  @Expose()
  @ValidateNested()
  metaTags: AdminMetaTagsDto;

  @Expose()
  @Transform((price, obj: ProductVariantWithQty) => price ? parseFloat(price) : obj.qtyInStock)
  @IsNumber()
  qtyInStock: number;

  @Expose()
  @Transform((price, obj: ProductVariantWithQty) => obj.qtyInStock - obj.reserved?.reduce((sum, ordered) => sum + ordered.qty, 0))
  sellableQty: number;

  @Expose()
  @IsBoolean()
  isDiscountApplicable: boolean;

  @Expose()
  @IsOptional()
  @IsNumber()
  salesCount: number;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isIncludedInShoppingFeed: boolean;

  @Expose()
  @Type(() => MultilingualTextDto)
  googleAdsProductTitle: MultilingualTextDto;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminLinkedProductDto)
  relatedProducts: AdminLinkedProductDto[];

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminLinkedProductDto)
  crossSellProducts: AdminLinkedProductDto[];

  @Expose()
  @IsOptional()
  @IsEnum(ProductLabelTypeEnum)
  label: ProductLabelTypeEnum;
}

export class AdminProductVariantDto extends AdminAddOrUpdateProductVariantDto {
}
