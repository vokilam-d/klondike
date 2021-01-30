import { ReviewSource } from '../enums/review-source.enum';

export const getValidReviewSource = (sourceParam: string): ReviewSource => {
  const isInEnum = Object.values(ReviewSource).includes(sourceParam as ReviewSource);
  if (isInEnum) {
    return sourceParam as ReviewSource;
  }

  return ReviewSource.Website;
}
