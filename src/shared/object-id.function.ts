import { Types } from 'mongoose';

export function toObjectId(id: string, errorCallback: () => void = () => {}): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    errorCallback();
  }

  return Types.ObjectId(id);
}