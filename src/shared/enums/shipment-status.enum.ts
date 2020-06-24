export enum ShipmentStatusEnum {

  AWAITING_TO_BE_RECEIVED_FROM_SENDER = 'AWAITING_TO_BE_RECEIVED_FROM_SENDER',
  DELETED = 'DELETED',
  NOT_FOUND = 'NOT_FOUND',
  IN_CITY = 'IN_CITY',
  HEADING_TO_CITY = 'HEADING_TO_CITY',
  IN_DESTINATION_CITY = 'IN_DESTINATION_CITY',
  IN_DESTINATION_WAREHOUSE = 'IN_DESTINATION_WAREHOUSE',
  RECEIVED = 'RECEIVED',
  AWAITING_CASH_ON_DELIVERY_PICK_UP = 'AWAITING_CASH_ON_DELIVERY_PICK_UP',
  CASH_ON_DELIVERY_PICKED_UP  = 'CASH_ON_DELIVERY_PICKED_UP ',
  UNDER_INSPECTION = 'UNDER_INSPECTION',
  HEADING_TO_RECIPIENT = 'HEADING_TO_RECIPIENT',
  RECIPIENT_DENIED = 'RECIPIENT_DENIED',
  ADDRESS_CHANGED = 'ADDRESS_CHANGED',
  STORAGE_STOPPED = 'STORAGE_STOPPED',
  BACK_DELIVERY_CREATED = 'BACK_DELIVERY_CREATED',
  STATUS_NOT_SUPPORTED = 'STATUS_NOT_SUPPORTED'

}
