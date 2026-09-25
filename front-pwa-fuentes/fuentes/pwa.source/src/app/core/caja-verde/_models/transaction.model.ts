import {ClientModel} from './client.model';
import {ReceiptModel} from './receipt.model';
import {PayserviceCompanyModel} from './payservice-company.model';
import {PaycardModel} from './paycard.model';
import {DepositModel} from './deposit.model';
import {PollModel} from './poll.model';
import {PayserviceModel} from './payservice.model';
import {DepositorModel} from './depositor.model';

export class TransactionModel {
  constructor () {
    this.clear();
  }

  idTransaction: number;
  ctCode: string;
  createDate: string;
  typeNemonic: string;
  typeCode: number;
  depositor: DepositorModel;
  payService?: PayserviceModel;
  payCard?: PaycardModel;
  deposit?: DepositModel;
  receipt: ReceiptModel;
  poll?:PollModel;


  clear(): void {
    this.idTransaction = 0;
    this.ctCode = '';
    this.createDate = '';
    this.typeNemonic = '';
    this.typeCode = 0;
    this.depositor = new DepositorModel();
    this.payService = new PayserviceModel();
    this.payCard = new PaycardModel();
    this.deposit = new DepositModel();
    this.receipt = new ReceiptModel();
    this.poll = new PollModel();
  }
}
