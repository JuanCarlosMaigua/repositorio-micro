import {SessionModel} from './session.model';
import {DepositModel} from './deposit.model';
import {DepositorModel} from './depositor.model';
import {PaycardModel} from './paycard.model';
import {PayserviceModel} from './payservice.model';

export class RequestTransactionDepositModel {
  constructor () {
    this.clear();
  }

  typeNemonic: string;
  typeCode: number;
  accessType: string;
  session: SessionModel;
  deposit?: DepositModel;
  payCard?: PaycardModel;
  payService?: PayserviceModel;
  depositor: DepositorModel;


  clear(): void {
    this.typeNemonic = '';
    this.typeCode = 0;
    this.accessType = '';
    this.session = new SessionModel();
    this.deposit = new DepositModel();
    this.payCard = new PaycardModel();
    this.depositor = new DepositorModel();
  }
}
