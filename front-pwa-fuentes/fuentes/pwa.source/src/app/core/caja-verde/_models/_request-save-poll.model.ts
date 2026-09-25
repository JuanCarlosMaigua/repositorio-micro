import {DeviceModel} from './device.model';
import {SessionModel} from './session.model';
import {DepositModel} from './deposit.model';
import {PaycardModel} from './paycard.model';
import {DepositorModel} from './depositor.model';

export class RequestSavePollModel {
  pollId: number;
  comment: string;
  liked: boolean | null;
  typeNemonic: string;

  clear(): void {
    this.pollId = 0;
    this.comment = '';
    this.liked = null;
    this.typeNemonic = '';
  }
}
