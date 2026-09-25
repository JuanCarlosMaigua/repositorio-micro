import {SessionModel} from './session.model';
import {DepositModel} from './deposit.model';
import {DepositorModel} from './depositor.model';
import {PaycardModel} from './paycard.model';

export class RequestTransactionPaycardModel {
  constructor () {
    this.clear();
  }

  typeNemonic: string;
  typeCode: number;
  accessType: string;
  session: SessionModel;
  payCard: PaycardModel;
  depositor: DepositorModel;


  clear(): void {
    this.typeNemonic = '';
    this.typeCode = 0;
    this.accessType = '';
    this.session = new SessionModel();
    this.payCard = new PaycardModel();
    this.depositor = new DepositorModel();
  }
}
