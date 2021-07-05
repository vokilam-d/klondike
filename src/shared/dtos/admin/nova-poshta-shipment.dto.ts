import { ShipmentStatusEnum } from '../../enums/shipment-status.enum';

export class NovaPoshtaShipmentDto {
  trackingNumber: string;
  status: ShipmentStatusEnum;
  statusDescription: string;
  scheduledDeliveryDate: string;
  paidStorageStartDate: Date;
}
