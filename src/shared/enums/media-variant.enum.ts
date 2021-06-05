export enum MediaVariantEnum {
  Original = 'original',
  Large = 'large',
  LargeSquare = 'large_square',
  Medium = 'medium',
  Small = 'small'
}

export const SquareMediaVariants: MediaVariantEnum[] = [
  MediaVariantEnum.LargeSquare
];

export const isMediaVariantSquare = (mediaVariant: MediaVariantEnum): boolean => {
  return SquareMediaVariants.includes(mediaVariant);
}
