
export class ReceiptModel {

  constructor () {
    this.clear();
  }
  codTrans: string;
  ipAgency: number;
  date: string;
  officeCode: string;
  currency: string;
  officeUser: string;
  sec: string;
  codTransOnOff: string;
  description: string;
  officeHour: string;


  clear(): void {
    this.codTrans = '';
    this.ipAgency = 0;
    this.date = '';
    this.officeCode = '';
    this.currency = '';
    this.officeUser = '';
    this.sec = '';
    this.codTransOnOff = '';
    this.description = '';
    this.officeHour = '';
  }
}
