import {BaseModel} from './_base.model';
import {CompanyModel} from './company.model';

export class ResCompanyModel extends BaseModel {
  companys: CompanyModel[];
}
