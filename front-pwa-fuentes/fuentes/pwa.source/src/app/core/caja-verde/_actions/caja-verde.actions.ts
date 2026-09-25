import { Action } from '@ngrx/store';
import {ConfigModel} from '../_models/config.model';
import {TransactionModel} from '../_models/transaction.model';
import {RequestTransactionDepositModel} from '../_models/_request-transaction-deposit.model';
import {RequestSavePollModel} from '../_models/_request-save-poll.model';

export enum CajaVerdeActionTypes {
  RegisterDevice = '[Caja Verde] Registrar Dispositivo',
  RecuestRegisterDevice = '[Caja Verde] Reguistrando dispositivo',
  RecuestStartSession = '[Caja Verde] Iniciando Session',
  StartSession = '[Caja Verde] Session Iniciada',
  HasTransactions = '[Caja Verde] valida que transacciones',
  saveTransactionsDepositRequest = '[Caja Verde] Guardar Transaccion',
  saveTransactionPollRequest = '[Caja Verde] Guardar Encuesta',
  viewQR = '[Caja Verde] VerQr',
  viewVoucher = '[Caja Verde] viewVoucher',
}

export class RegisterDeviceRequested implements Action {
  readonly type = CajaVerdeActionTypes.RecuestRegisterDevice;
}

export class RegisterDevice implements Action {
    readonly type = CajaVerdeActionTypes.RegisterDevice;
    constructor(public payload: { deviceId: number, sessionID: number, deviceType: string, config: ConfigModel}) { }
}

export class StartSessionRequested implements Action {
  readonly type = CajaVerdeActionTypes.RecuestStartSession;
}

export class StartSession implements Action {
  readonly type = CajaVerdeActionTypes.StartSession;
  constructor(public payload: { deviceId: number, sessionID: number, config: ConfigModel}) { }
}

export class HasTransactions implements Action {
  readonly type = CajaVerdeActionTypes.HasTransactions;

  constructor(public payload:{transactions: TransactionModel[]}) { }
}


export class SaveTransactionsDeposit implements Action {
  readonly type = CajaVerdeActionTypes.saveTransactionsDepositRequest;

  constructor(public payload:{transaction: RequestTransactionDepositModel}) { }
}

export class SaveTransactionPoll implements Action {
  readonly type = CajaVerdeActionTypes.saveTransactionPollRequest;

  constructor(public payload:{poll: RequestSavePollModel}) { }
}


export class ViewQR implements Action {
  readonly type = CajaVerdeActionTypes.viewQR;
  constructor(public payload:{transaction: TransactionModel}) { }
}

export class ViewVoucher implements Action {
  readonly type = CajaVerdeActionTypes.viewVoucher;
  constructor(public payload:{transaction: TransactionModel}) { }
}


export type CajaVerdeActions = RegisterDevice | StartSession | HasTransactions | ViewQR | ViewVoucher | SaveTransactionPoll;
