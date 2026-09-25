
export class DepositorModel {

  constructor () {
    this.clear();
  }

  identification?: string;
  identificationId?: string;
  name: string;
  mail: string;
  phone: string;

  clear(): void {
    this.identification = '';
    this.identificationId = '';
    this.name = '';
    this.mail = '';
    this.phone = '';
  }
}
