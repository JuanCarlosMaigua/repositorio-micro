import {PayserviceCompanyModel} from './payservice-company.model';
import {ClientModel} from './client.model';
import {CompanyModel} from './company.model';

export class PayserviceModel {


  constructor () {
    this.clear();
  }
  company: CompanyModel;
  client: ClientModel;
  serviceCode: string;
  nCheck: number;
  commission: number;
  amountCash: number;
  amountCheck: number;
  totalDbt: number;
  totalAmount: number;
  fundsSource: string;
  fundsDestination: string;
  bill: boolean;
  minAmount: null;

  clear(): void {
    this.company = new CompanyModel();
    this.client = new ClientModel();
    this.serviceCode = '';
    this.nCheck = 0;
    this.commission = 0;
    this.amountCash = 0;
    this.amountCheck = 0;
    this.totalDbt = 0;
    this.totalAmount = 0;
    this.fundsSource = '';
    this.fundsDestination = '';
    this.bill = false;
  }
}
