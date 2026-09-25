import {Deserializable} from './deserializable.model';

export class FormModel implements Deserializable {

  public deviceID: string;
  public sessionID: string;
  public recipientAccountNumber: string;
  public recipientName: string;
  public recipientAccountTypeCode: number;
  public amountCash: string;
  public amountCheck: string;
  public nCheque: number;
  public depositorDNI: string;
  public depositorName: string;
  public fundsSource: string;
  public fundsDestination: string;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }

}
