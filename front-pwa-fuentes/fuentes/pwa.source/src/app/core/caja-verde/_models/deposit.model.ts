import {ClientModel} from './client.model';

export class DepositModel {

  accountNumber: string;
  accountTypeCode: number;
  amountCash: number;
  amountCheck: number;
  nCheck: number;
  fundsSource: string;
  fundsDestination: string;
  sign: string;
  client: ClientModel;
  own?: boolean;

  clear(): void {
    this.accountNumber = '';
    this.accountTypeCode = 0;
    this.amountCash = 0;
    this.amountCheck = 0;
    this.nCheck = 0;
    this.fundsSource = '';
    this.fundsDestination = '';
    this.sign = '';
    this.client = new ClientModel();
  }
}
