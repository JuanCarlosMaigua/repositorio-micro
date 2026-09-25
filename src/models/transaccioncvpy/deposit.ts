import { Client } from '../shared/client';

export interface Deposit {
  accountNumber: string;
  accountTypeCode: string;
  amountCash?: number;
  amountCheck?: number;
  nCheck?: number;
  fundsSource?: string;
  fundsDestination?: string;
  sign?: string;
  client?: Client;
}