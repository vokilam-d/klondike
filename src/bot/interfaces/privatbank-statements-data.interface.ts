export interface IPrivatbankBalanceData {
  oper: string;
  info: {
    cardbalance: {
      card: {
        account: string;
        card_number: string;
        acc_name: string;
        acc_type: string;
        currency: string;
        card_type: string;
        main_card_number: string;
        card_stat: string;
        src: string;
      };
      av_balance: string;
      bal_date: string;
      bal_dyn: string;
      balance: string;
      fin_limit: string;
      trade_limit: string;
    }
  }
}
