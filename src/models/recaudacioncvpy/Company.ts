export interface Catalog {
    key: string;
    value: string;
  }
  
  export interface Service {
    idService: number;
    nameService: string;
  }
  
  export interface Company extends Service {
    idCompany: number;
    nameCompany: string;
    type: Catalog[];
    region: Catalog[];
    area: Catalog[];
  }
  