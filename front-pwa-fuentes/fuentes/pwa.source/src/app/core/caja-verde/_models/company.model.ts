import {CompanyDetailModel} from './company-detail.model';

export class CompanyModel {

  constructor () {
    this.clear();
  }
  idCompany: number;
  nameCompany: string;
  type?: CompanyDetailModel[];
  region?: CompanyDetailModel[];
  area?: CompanyDetailModel[];

  clear() {
    this.idCompany = 0;
    this.nameCompany = '';
    this.type = [];
    this.region = [];
    this.area = [];
  }
}
