import { Client } from "../shared/client";
import { BasicResponse } from "../transaccioncvpy/common";
import { CreditCard } from "./creditCard";

export interface OutMsgGetCard extends BasicResponse {
    client?: Client;
    creditCards?: CreditCard[];
}