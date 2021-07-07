import { HttpException, HttpService, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { TaxShiftDto } from '../../shared/dtos/admin/tax/tax-shift.dto';
import { TaxReceiptDto } from '../../shared/dtos/admin/tax/tax-receipt.dto';
import { TaxReceiptSellDto } from '../../shared/dtos/admin/tax/tax-receipt-sell.dto';
import { TaxLoginDto } from '../../shared/dtos/admin/tax/tax-login.dto';
import { TaxAccessTokenDto } from '../../shared/dtos/admin/tax/tax-access-token.dto';

interface ICheckboxError {
  message: string;
  detail: {
    loc: string[];
    msg: string;
    type: string;
  }[];
}

@Injectable()
export class CheckboxConnector implements OnApplicationBootstrap {

  private readonly apiHost = `https://dev-api.checkbox.in.ua/api/v1`;
  private readonly logger = new Logger(CheckboxConnector.name);

  private accessToken: string = null;

  constructor(
    private readonly http: HttpService
  ) { }

  async onApplicationBootstrap() {
    this.login().then();
  }

  async getCurrentShift(): Promise<TaxShiftDto> {
    return this.get<TaxShiftDto>(`/cashier/shift`, `Could not get current shift`);
  }

  async openShift(): Promise<TaxShiftDto> {
    return this.post<TaxShiftDto>(`/shifts`, null, `Could not open shift`);
  }

  async closeShift(): Promise<TaxShiftDto> {
    return this.post<TaxShiftDto>(`/shifts/close`, null, `Could not close shift`);
  }

  async getReceipt(id: string): Promise<TaxReceiptDto> {
    return this.get<TaxReceiptDto>(`/receipts/${id}`, `Could not get receipt`);
  }

  async createReceipt(createReceiptDto: TaxReceiptSellDto): Promise<TaxReceiptDto> {
    return this.post<TaxReceiptDto>(`/receipts/sell`, createReceiptDto, `Could not create receipt`);
  }

  private async login(): Promise<void> {
    const payloadDto: TaxLoginDto = {
      login: process.env.CHECKBOX_CASHIER_LOGIN,
      password: process.env.CHECKBOX_CASHIER_PASSWORD
    };

    try {
      const tokenDto = await this.post<TaxAccessTokenDto>(`/cashier/signin`, payloadDto, `Could not log in in tax service`);
      this.accessToken = tokenDto.access_token;

      this.logger.log(`Successfully logged in in tax service`)
    } catch (e) {
      this.logger.error(`Could not log in in tax service:`);
      this.logger.error(e.response?.data || e.response || e);
    }
  }

  private async get<T>(endpoint: string, errorDescription: string): Promise<T> {
    const url = this.buildUrl(endpoint);
    try {
      const response = await this.http.get<T>(url, { headers: this.getHeaders() }).toPromise();
      return response.data;
    } catch (e) {
      this.onHttpError(errorDescription, e);
    }
  }

  private async post<T>(endpoint: string, data: any, errorDescription: string): Promise<T> {
    const url = this.buildUrl(endpoint);
    try {
      const response = await this.http.post<T>(url, data, { headers: this.getHeaders() }).toPromise();
      return response.data;
    } catch (e) {
      this.onHttpError(errorDescription, e);
    }
  }

  private buildUrl(endpoint: string): string {
    return `${this.apiHost}${endpoint}`;
  }

  private getHeaders(): { [key: string]: string } {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'X-License-Key': process.env.CHECKBOX_LICENSE_KEY
    };
  }

  private onHttpError(errorDescription: string, error: any) {
    const checkboxError: ICheckboxError = error.response?.data;

    this.logger.error(errorDescription);
    this.logger.error(checkboxError || error.response || error);

    throw new HttpException(checkboxError || error, error.response?.status);;
  }
}
