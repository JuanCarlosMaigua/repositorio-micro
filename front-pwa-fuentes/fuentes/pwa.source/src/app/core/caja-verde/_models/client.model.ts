
export class ClientModel {

  constructor () {
    this.clear();
  }

  identification?: string;
  name: string;
  phone?: string;
  email?: string;

  clear(): void {
    this.identification = '';
    this.name = '';
    this.phone = '';
    this.email = '';
  }
}
