import {BaseModel} from './_base.model';
import {AccountModel} from './account.model';
import {CredicardModel} from './credicard.model';
import {ClientModel} from './client.model';

export class ResCreditcardModel extends BaseModel {
  client: ClientModel;
  creditCards: CredicardModel[];
}
