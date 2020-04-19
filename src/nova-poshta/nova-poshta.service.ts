import { HttpService, Injectable } from '@nestjs/common';
import { SettlementDto } from './models/settlement.dto';
import { WarehouseDto } from './models/warehouse.dto';
import { ShipmentDto } from '../shared/dtos/admin/shipment.dto';
import { ShipmentStatusEnum } from '../shared/enums/shipment-status.enum';

@Injectable()
export class NovaPoshtaService {

  constructor(private readonly http: HttpService) {
  }

  public async fetchShipment(shipmentDto: ShipmentDto): Promise<ShipmentDto> {
    const shipments = await this.fetchShipments([shipmentDto]);
    return shipments[0];
  }

  public async fetchShipments(shipmentDtos: ShipmentDto[]): Promise<ShipmentDto[]> {
    const response = await this.http.post('http://testapi.novaposhta.ua/v2.0/en/documentsTracking/json',
      {
        modelName: 'TrackingDocument',
        calledMethod: 'getStatusDocuments',
        methodProperties: {
          Documents: shipmentDtos.map(shipment =>
            ({ DocumentNumber: shipment.trackingNumber, Phone: shipment.senderPhone }))
        },
        apiKey: process.env.NOVA_POSHTA_API_KEY
      }).toPromise();

    return response.data.data.map(shipment => ({
      trackingNumber: shipment.Number,
      status: NovaPoshtaService.toShipmentStatus(shipment.StatusCode),
      statusDescription: shipment.Status,
      senderPhone: shipment.PhoneSender
    }));
  }

  private static toShipmentStatus(status): ShipmentStatusEnum {
    switch (status) {
      case '1':
        return ShipmentStatusEnum.AWAITING_TO_BE_RECEIVED_FROM_SENDER;
      case '2':
        return ShipmentStatusEnum.DELETED;
      case '3':
        return ShipmentStatusEnum.NOT_FOUND;
      case '4':
      case '41':
        return ShipmentStatusEnum.IN_CITY;
      case '5':
        return ShipmentStatusEnum.HEADING_TO_CITY;
      case '6':
        return ShipmentStatusEnum.IN_DESTINATION_CITY;
      case '7':
      case '8':
        return ShipmentStatusEnum.IN_DESTINATION_WAREHOUSE;
      case '9':
        return ShipmentStatusEnum.RECEIVED;
      case '10':
        return ShipmentStatusEnum.AWAITING_CASH_ON_DELIVERY_PICK_UP;
      case '11':
        return ShipmentStatusEnum.CASH_ON_DELIVERY_PICKED_UP;
      case '14':
        return ShipmentStatusEnum.UNDER_INSPECTION;
      case '101':
        return ShipmentStatusEnum.HEADING_TO_RECEPIENT
      case '102':
      case '103':
      case '108':
        return ShipmentStatusEnum.RECEPIENT_DENIED;
      case '104':
        return ShipmentStatusEnum.ADDRESS_CHANGED;
      case '105':
        return ShipmentStatusEnum.STORAGE_STOPPED;
      case '106':
        return ShipmentStatusEnum.BACK_DELIVERY_CREATED;
      default:
        return ShipmentStatusEnum.STATUS_NOT_SUPPORTED;
    }
  }

  public async fetchSettlementCatalogPage(settlementBulkNumber: number): Promise<SettlementDto[]> {
    const response = await this.http.post('http://api.novaposhta.ua/v2.0/json/Address/searchSettlements/',
      {
        modelName: 'AddressGeneral',
        calledMethod: 'getSettlements',
        methodProperties: {
          Page: settlementBulkNumber,
          Warehouse: '1'
        },
        apiKey: process.env.NOVA_POSHTA_API_KEY
      }).toPromise();

    return response.data.data.map(settlement => NovaPoshtaService.toSettlementDto(settlement));
  }

  private static toSettlementDto(settlement): SettlementDto {
    const shortSettlementType = this.shortenSettlementType(settlement.SettlementTypeDescription);
    let fullName = `${shortSettlementType} ${settlement.Description} (${settlement.AreaDescription}`;
    if (settlement.RegionsDescription) {
      fullName += ', ' + settlement.RegionsDescription
    }
    fullName += ')';

    return {
      id: settlement.Ref,
      name: settlement.Description,
      ruName: settlement.DescriptionRu,
      fullName: fullName
    };
  }

  private static shortenSettlementType(settlementType: string): string {
    if (settlementType.includes('селище міського типу')) {
      return 'смт.'
    } else if (settlementType.includes('село') || settlementType.includes('селище')) {
      return 'с.'
    } else if (settlementType.includes('місто')) {
      return 'м.'
    }
    return '';
  }

  public async fetchWarehouseCatalogPage(warehouseBulkNumber: number): Promise<WarehouseDto[]> {
    const response = await this.http.post('http://api.novaposhta.ua/v2.0/json/AddressGeneral/getWarehouses',
      {
        modelName: 'AddressGeneral',
        calledMethod: 'getWarehouses',
        methodProperties: {
          Page: warehouseBulkNumber,
          Limit: 500
        },
        apiKey: process.env.NOVA_POSHTA_API_KEY
      }).toPromise();

    return response.data.data.map(warehouse => NovaPoshtaService.toWarehouseDto(warehouse));
  }

  private static toWarehouseDto(warehouse): WarehouseDto {

    return {
      id: warehouse.Ref,
      description: `№${warehouse.Number} (${this.getStreetWithHouse(warehouse)})`.replace(/\"/g, ''),
      settlementId: warehouse.SettlementRef,
      postOfficeNumber: warehouse.Number,
      address: this.getStreet(warehouse.ShortAddress),
      addressRu: this.getStreet(warehouse.ShortAddressRu)
    };
  }

  private static getStreetWithHouse(warehouse) {
    return warehouse.Description.substring(warehouse.Description.indexOf(':') + 1).trim();
  }

  private static getStreet(shortAddress): string {
    if (!shortAddress) {
      return '';
    }
    let result = shortAddress;
    const split = shortAddress.split(',');
    if (split.length > 1) {
      result = split[1];
    }
    return result.trim().toLowerCase();
  }

}
