import { Client } from '../shared/client';

export interface CreditCard {
  cardNumber: string;
  cardKey: string;
  cardType: string;
  cardBrand: string;
  own: boolean;
  client?: Client;
}