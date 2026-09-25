export class CredicardModel {

  constructor () {
    this.clear();
  }
  cardNumber: string;
  cardKey: string;
  cardType: string;
  cardBrand: string;
  own: boolean;

  clear(): void {
    this.cardNumber = '';
    this.cardKey = '';
    this.cardType = '';
    this.cardBrand = '';
    this.own = true;
  }
}
