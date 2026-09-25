import { Client } from '../shared/client';
import { Company } from './company';

export interface PayService {
  company?: Company;
  client?: Client;
  serviceCode?: string;
  nCheck?: number;
  bill?: boolean;
  commission?: number;
  amountCash?: number;
  amountCheck?: number;
  totalAmount?: number;
  minAmount?: number;
  totalDbt?: number;
  fundsSource?: string;
  fundsDestination?: string;
}