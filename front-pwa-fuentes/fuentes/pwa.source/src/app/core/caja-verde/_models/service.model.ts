import {ClientModel} from './client.model';

export class ServiceModel {

  constructor () {
    this.clear();
  }

  totalDbt?: number;
  minAmount: number;
  commission?: number;
  client?: ClientModel;

  clear(): void {
    this.totalDbt = 0;
    this.minAmount = 0;
    this.commission = 0;
    this.client = new ClientModel();
  }
}
