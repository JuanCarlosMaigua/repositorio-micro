import {ClientModel} from './client.model';

export class PaycardModel {

  constructor () {
    this.clear();
  }
  cardNumber: string;
  cardKey: string;
  cardType: string;
  cardBrand: string;
  amountCash: number;
  nCheck: number;
  amountCheckBb: number;
  amountCheckOb: number;
  amountTotalCheckEx: number;
  amountCheckMi: number;
  amountCheckNy: number;
  amountCheckOp: number;
  totalAmount: number;
  fundsSource: string;
  fundsDestination: string;
  client: ClientModel;

  clear(): void {
    this.cardNumber = '';
    this.cardKey = '';
    this.cardType = '';
    this.cardBrand = '';
    this.amountCash = 0;
    this.nCheck = 0;
    this.amountCheckBb = 0;
    this.amountCheckOb = 0;
    this.amountTotalCheckEx = 0;
    this.amountCheckMi = 0;
    this.amountCheckNy = 0;
    this.amountCheckOp = 0;
    this.totalAmount = 0;
    this.fundsSource = '';
    this.fundsDestination = '';
    this.client = new ClientModel();
  }
}
