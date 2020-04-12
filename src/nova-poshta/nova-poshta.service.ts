import {HttpService, Injectable, Logger} from '@nestjs/common';

@Injectable()
export class NovaPoshtaService {

    private logger = new Logger(NovaPoshtaService.name);

    constructor(private readonly http: HttpService) {
    }

    async getCities(filter: string, limit: number) {
        let url = 'http://testapi.novaposhta.ua/v2.0/json/Address/searchSettlements/';
        let reqBody = {
            "apiKey": "fc458ea324bd4fea1f1013dba44cdd03",
            "modelName": "Address",
            "calledMethod": "searchSettlements",
            "methodProperties": {
                "CityName": filter,
                "Limit": limit
            }
        };
        try {
            const response = await this.http.post(url, reqBody).toPromise();
            return response.data.data[0].Addresses
                .map(a => `${a.SettlementTypeCode}${a.MainDescription} (${a.Area} ${a.ParentRegionCode})`)
                .sort();
        } catch (ex) {
            this.logger.error('Could not fetch cities:');
            throw ex;
        }
    }

}
