
export class ConfigModel {

  constructor () {
    this.clear();
  }

  lifeTimeMobile: number;
  lifeTimeWeb: number;
  canTransactions: number;
  legalInformation: number;
  maxAmmount: number;

  clear(): void {
    this.lifeTimeMobile = 0;
    this.lifeTimeWeb = 0;
    this.canTransactions = 0;
    this.legalInformation = 0;
    this.maxAmmount = 0;
  }
}
