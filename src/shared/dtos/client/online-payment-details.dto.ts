export class OnlinePaymentDetailsDto {
  merchantAccount: string;
  merchantAuthType: 'SimpleSignature' | 'ticket' | 'password';
  merchantDomainName: string;
  merchantSignature: string;
  orderReference: string;
  orderDate: string;
  orderNo: string;
  amount: number;
  currency: 'UAH';
  productName: string[];
  productPrice: number[];
  productCount: number[];
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  language: 'RU' | 'UA';
}
