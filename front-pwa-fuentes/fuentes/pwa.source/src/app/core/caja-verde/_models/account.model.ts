export class AccountModel  {
  public accountName: string;
  public accountNumber: string;
  public accountTypeCode: number;
  public accountOwnerDNI: string;
  public mail: string;
  public phone: string;

  clear(): void {
    this.accountName = '';
    this.accountNumber = '';
    this.accountTypeCode = 0;
    this.accountOwnerDNI = '';
    this.mail = '';
    this.phone = '';
  }

}
