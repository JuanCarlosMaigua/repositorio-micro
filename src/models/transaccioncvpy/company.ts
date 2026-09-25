import { Catalog } from './catalog';

export interface Company {
  idCompany?: number;
  nameCompany?: string;
  idService?: number;
  nameService?: string;
  type?: Catalog[];
  region?: Catalog[];
  area?: Catalog[];
}