import {DeviceModel} from './device.model';
import {SessionModel} from './session.model';
import {DepositModel} from './deposit.model';
import {PaycardModel} from './paycard.model';
import {DepositorModel} from './depositor.model';
import {CompanyModel} from './company.model';

export class RequestServiceModel {
  serviceCode: string;
  company: CompanyModel;

  clear(): void {
    this.serviceCode = '';
    this.company = new CompanyModel();
  }
}
