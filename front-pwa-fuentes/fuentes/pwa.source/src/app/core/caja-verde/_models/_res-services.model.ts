import {BaseModel} from './_base.model';
import {AccountModel} from './account.model';
import {ServicesModel} from './services.model';

export class ResServicesModel extends BaseModel {
  service: ServicesModel[];
}
