import { BasicResponse } from './common';
import { Session } from './session';
import { Client } from '../shared/client';
import { Deposit } from './deposit';
import { PayCard } from './paycard';
import { PayService } from './payservice';
import { Receipt } from './receipt';
import { Poll } from './poll';

export interface TransactionResult {
    success: boolean;
    errorCode?: string;
    userMessage?: string;
    systemMessage?: string;
    transaction?: Transaction;
  }

export interface Transaction {
  idTransaction?: number;
  ctCode?: string;
  createDate?: string;// Date;
  maxTime?: number;
  maxTransaction?: number;
  typeNemonic?: string;
  typeCode?: number;
  accessType?: string;
  session?: Session;
  depositor?: Client;
  deposit?: Deposit;
  payCard?: PayCard;
  payService?: PayService;
  receipt?: Receipt;
  poll?: Poll;
  check?: boolean;
}

export interface InMsgListTransactions {
  device: {
    deviceId: number;
  };
}

export interface OutMsgListTransactions extends BasicResponse {
  transactions?: Transaction[];
}

export interface InMsgSaveTransaction {
  transaction: Transaction;
}

export interface OutMsgSaveTransaction extends BasicResponse {
  transaction?: Transaction;
}

export interface InMsgGetTransaction {
  ctCode: string;
}

export interface OutMsgGetTransaction extends BasicResponse {
  transaction?: Transaction;
}