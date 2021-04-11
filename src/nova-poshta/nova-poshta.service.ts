import { BadRequestException, HttpService, Injectable } from '@nestjs/common';
import { SettlementDto } from '../shared/dtos/shared-dtos/settlement.dto';
import { WarehouseDto } from '../shared/dtos/shared-dtos/warehouse.dto';
import { BaseShipmentDto } from '../shared/dtos/shared-dtos/base-shipment.dto';
import { ShipmentStatusEnum } from '../shared/enums/shipment-status.enum';
import { StreetDto } from '../shared/dtos/shared-dtos/street.dto';
import { ClientSPFDto } from '../shared/dtos/client/spf.dto';
import { AddressTypeEnum } from '../shared/enums/address-type.enum';
import { PaymentTypeEnum } from '../shared/enums/payment-type.enum';
import { ShipmentPaymentMethodEnum } from '../shared/enums/shipment-payment-method.enum';
import { ShipmentAddressDto } from '../shared/dtos/shared-dtos/shipment-address.dto';
import { ShipmentSender } from './models/shipment-sender.model';
import { ShipmentSenderService } from './shipment-sender.service';
import { ShipmentPayerEnum } from '../shared/enums/shipment-payer.enum';
import { FileLogger } from '../logger/file-logger.service';

@Injectable()
export class NovaPoshtaService {

  private apiUrl = 'http://api.novaposhta.ua/v2.0/json/';
  private static settlementPriority = new Map([
    ['Киев', 1], ['Харьков', 2], ['Одесса', 3], ['Днепр', 4],
    ['Запорожье', 5], ['Львов', 6], ['Кривой Рог', 7], ['Николаев', 8], ['Мариуполь', 9]
  ]);

  constructor(
    private readonly http: HttpService,
    private readonly shipmentSenderService: ShipmentSenderService,
    private readonly fileLogger: FileLogger
  ) {
    this.fileLogger.setContext(NovaPoshtaService.name);
  }

  public async shipmentRecipient(spf: ClientSPFDto): Promise<ShipmentAddressDto> {

    const { data: response } = await this.http.post(this.apiUrl,
      {
        modelName: 'Counterparty',
        calledMethod: 'getCatalogCounterparty',
        methodProperties: {
          Phone: spf.phone,
          LastName: spf.lastName
        },
        apiKey: this.shipmentSenderService.defaultSender.apiKey
      }).toPromise();

    if (response.success === false) {
      throw new BadRequestException(response.errors.join(', '));
    }

    if (response.data.length === 1) {
      const counterparty = response.data[0];
      return {
        lastName: counterparty.LastName,
        firstName: counterparty.FirstName,
        middleName: counterparty.MiddleName
      };
    } else {
      return {};
    }
  }

  public async createInternetDocument(shipment: BaseShipmentDto,
                                      sender: ShipmentSender,
                                      orderPaymentMethod: PaymentTypeEnum) {

    const recipient = shipment.recipient;
    const saveContactRequestBody = {
      modelName: 'ContactPerson',
      calledMethod: 'save',
      methodProperties: {
        FirstName: recipient.firstName,
        LastName: recipient.lastName,
        MiddleName: recipient.middleName,
        CounterpartyRef: sender.counterpartyRef,
        Phone: recipient.phone
      },
      apiKey: sender.apiKey
    };
    saveContactRequestBody.modelName = 'ContactPersonGeneral';
    const { data: contactPersonSaveResponse } = await this.http.post(this.apiUrl, saveContactRequestBody).toPromise();

    if (contactPersonSaveResponse.success === false) {
      throw new BadRequestException(contactPersonSaveResponse.errors.join(', '));
    }

    const contactPersonRef = contactPersonSaveResponse.data[0].Ref;

    const saveAddressRequestBody: any = {
      modelName: 'AddressContactPersonGeneral',
      calledMethod: 'save',
      methodProperties: {
        ContactPersonRef: contactPersonRef,
        SettlementRef: recipient.settlementId,
        AddressRef: recipient.addressId,
        AddressType: recipient.addressType
      },
      apiKey: sender.apiKey
    };

    if (recipient.addressType === AddressTypeEnum.DOORS) {
      saveAddressRequestBody.methodProperties.BuildingNumber = recipient.buildingNumber;
      saveAddressRequestBody.methodProperties.Flat = recipient.flat;
      saveAddressRequestBody.methodProperties.Note = '';
    }

    const { data: saveAddressResponse } = await this.http.post(this.apiUrl, saveAddressRequestBody).toPromise();

    if (saveAddressResponse.success === false) {
      throw new BadRequestException(saveAddressResponse.errors.join(', '));
    }

    const recipientAddress = saveAddressResponse.data[0].Ref;
    const cityRef = saveAddressResponse.data[0].CityRef;

    const today = new Date();
    let saveInternetDocumentRequestBody: any = {
      modelName: 'InternetDocument',
      calledMethod: 'save',
      methodProperties: {
        CitySender: sender.cityId,
        Sender: sender.senderId,
        ContactSender: sender.contactId,
        SenderAddress: sender.addressId,
        SendersPhone: sender.phone,
        Recipient: sender.counterpartyRef,
        CityRecipient: cityRef,
        RecipientAddress: recipientAddress,
        ContactRecipient: contactPersonRef,
        RecipientsPhone: recipient.phone,
        ServiceType: sender.addressType + recipient.addressType,
        CargoType: 'Cargo',
        ParamsOptionsSeats: false,
        Cost: shipment.cost,
        Description: shipment.description,
        PayerType: shipment.payerType,
        PaymentMethod: ShipmentPaymentMethodEnum.CASH,
        DateTime: `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear()}`,
        SeatsAmount: '1',
        OptionsSeat: [
          {
            weight: shipment.weight,
            volumetricLength: shipment.length,
            volumetricWidth: shipment.width,
            volumetricHeight: shipment.height
          }
        ]
      },
      apiKey: sender.apiKey
    };

    if (orderPaymentMethod === PaymentTypeEnum.CASH_ON_DELIVERY) {
      const redelivery = shipment.backwardMoneyDelivery || shipment.cost;
      saveInternetDocumentRequestBody.methodProperties.BackwardDeliveryData = [{
        PayerType: ShipmentPayerEnum.RECIPIENT, // Cash on delivery is always paid by recipient
        CargoType: 'Money',
        RedeliveryString: redelivery
      }];
    }

    this.fileLogger.log(`Creating internet document for cost=${saveInternetDocumentRequestBody.methodProperties.Cost}, payerType=${saveInternetDocumentRequestBody.methodProperties.PayerType}, backwardDeliveryPayer=${saveInternetDocumentRequestBody.methodProperties.BackwardDeliveryData?.[0]?.PayerType}...`);

    const { data: internetDocumentSaveResponse } = await this.http.post(this.apiUrl, saveInternetDocumentRequestBody).toPromise();

    if (internetDocumentSaveResponse.success === false) {
      throw new BadRequestException(internetDocumentSaveResponse.errors.join(', '));
    }

    const responseData = internetDocumentSaveResponse.data[0];

    return {
      trackingNumber: responseData.IntDocNumber,
      estimatedDeliveryDate: responseData.EstimatedDeliveryDate
    };
  }

  public async fetchStreets(spf: ClientSPFDto): Promise<StreetDto[]> {
    const { data: response } = await this.http.post(this.apiUrl,
      {
        modelName: 'Address',
        calledMethod: 'searchSettlementStreets',
        methodProperties: {
          StreetName: spf.filter,
          SettlementRef: spf.settlementId,
          Limit: spf.limit
        },
        apiKey: this.shipmentSenderService.defaultSender.apiKey
      }).toPromise();

    if (response.success === false) {
      throw new BadRequestException(response.errors.join(', '));
    }

    return response.data.flatMap(resp => resp.Addresses).map(street => ({
      id: street.SettlementStreetRef,
      name: street.Present
    }));
  }

  public async fetchShipment(trackingNumber: string): Promise<BaseShipmentDto> {
    const shipments = await this.fetchShipments([trackingNumber]);
    return shipments[0];
  }

  public async fetchShipments(trackingNumbers: string[]): Promise<BaseShipmentDto[]> {
    if (!trackingNumbers?.length) { return []; }

    const maxDocumentsCountInRequest = 100;
    const responseDocuments: any[] = [];

    for (let i = 0; i < Math.ceil(trackingNumbers.length / maxDocumentsCountInRequest); i++) {
      const startIdx = i * maxDocumentsCountInRequest;
      const Documents = trackingNumbers
        .slice(startIdx, startIdx + maxDocumentsCountInRequest)
        .map(trackingNumber => ({ DocumentNumber: trackingNumber }))

      const { data: response } = await this.http.post(`${this.apiUrl}en/documentsTracking/json`,
        {
          modelName: 'TrackingDocument',
          calledMethod: 'getStatusDocuments',
          methodProperties: {
            Documents
          },
          apiKey: this.shipmentSenderService.defaultSender.apiKey
        }).toPromise();

      if (response.success === false) {
        throw new BadRequestException(response.errors.join(', '));
      }

      responseDocuments.push(...response.data);
    }

    return responseDocuments.map(shipment => ({
      trackingNumber: shipment.Number,
      status: NovaPoshtaService.toShipmentStatus(shipment.StatusCode),
      statusDescription: shipment.Status
    }));
  }

  public async fetchSettlementCatalogPage(settlementBulkNumber: number): Promise<SettlementDto[]> {
    const { data: response } = await this.http.post(`${this.apiUrl}Address/searchSettlements/`,
      {
        modelName: 'AddressGeneral',
        calledMethod: 'getSettlements',
        methodProperties: {
          Page: settlementBulkNumber,
          Warehouse: '1'
        },
        apiKey: this.shipmentSenderService.defaultSender.apiKey
      }).toPromise();

    return response.data.map(settlement => NovaPoshtaService.toSettlementDto(settlement));
  }

  public async fetchWarehouseCatalogPage(warehouseBulkNumber: number): Promise<WarehouseDto[]> {
    const { data: response } = await this.http.post(`${this.apiUrl}AddressGeneral/getWarehouses`,
      {
        modelName: 'AddressGeneral',
        calledMethod: 'getWarehouses',
        methodProperties: {
          Page: warehouseBulkNumber,
          Limit: 500
        },
        apiKey: this.shipmentSenderService.defaultSender.apiKey
      }).toPromise();

    if (response.success === false) {
      throw new BadRequestException(response.errors.join(', '));
    }

    return response.data.map(warehouse => NovaPoshtaService.toWarehouseDto(warehouse));
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
        return ShipmentStatusEnum.HEADING_TO_RECIPIENT
      case '102':
      case '103':
      case '108':
        return ShipmentStatusEnum.RECIPIENT_DENIED;
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

  private static toSettlementDto(settlement): SettlementDto {
    const shortSettlementType = this.shortenSettlementType(settlement.SettlementTypeDescription);
    const ruName = settlement.DescriptionRu;
    const priority = NovaPoshtaService.settlementPriority.has(ruName) && shortSettlementType === 'м.'
      ? NovaPoshtaService.settlementPriority.get(ruName)
      : 99;
    let fullName = `${shortSettlementType} ${settlement.Description} (${settlement.AreaDescription}`;
    if (settlement.RegionsDescription) {
      fullName += ', ' + settlement.RegionsDescription
    }
    fullName += ')';
    return {
      id: settlement.Ref,
      name: settlement.Description,
      nameWithType: `${shortSettlementType} ${settlement.Description}`,
      ruName: ruName,
      fullName: fullName,
      priority: priority
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

  private static toWarehouseDto(warehouse): WarehouseDto {
    return {
      id: warehouse.Ref,
      name: `№${warehouse.Number}`,
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
