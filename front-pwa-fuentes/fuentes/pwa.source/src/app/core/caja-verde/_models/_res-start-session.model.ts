import {BaseModel} from './_base.model';
import {ConfigModel} from './config.model';
import {SessionModel} from './session.model';

export class ResStartSessionModel extends BaseModel{
  session: SessionModel;
  configuration: ConfigModel;
}
