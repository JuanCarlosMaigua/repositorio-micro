import {PayserviceCompanyTypeModel} from './payservice-company-type.model';

export class PayserviceCompanyModel {

  constructor () {
    this.clear();
  }
  idService: number;
  nameService: string;
  idCompany: number;
  nameCompany: string;
  type: PayserviceCompanyTypeModel[];
  region: [];
  area: [];

  clear(): void {
    this.idService = 0;
    this.nameService = '';
    this.idCompany = 0;
    this.nameCompany = '';
    this.type = [];
    this.region = [];
    this.area = [];
  }
}
