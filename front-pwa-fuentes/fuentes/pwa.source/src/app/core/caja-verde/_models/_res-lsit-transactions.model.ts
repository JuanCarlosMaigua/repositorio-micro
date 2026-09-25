import {BaseModel} from './_base.model';
import {ConfigModel} from './config.model';
import {SessionModel} from './session.model';
import {TransactionModel} from './transaction.model';

export class ResLsitTransactionsModel extends BaseModel{
  transactions: TransactionModel[]
}
