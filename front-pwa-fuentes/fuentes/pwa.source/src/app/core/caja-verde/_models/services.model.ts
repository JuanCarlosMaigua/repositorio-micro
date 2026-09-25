
export class ServicesModel {

  constructor () {
    this.clear();
  }
  idService: number;
  nameService: string;

  clear() {
    this.idService = 0;
    this.nameService = '';
  }
}
