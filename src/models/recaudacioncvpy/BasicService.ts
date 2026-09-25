import { Client } from "../shared/client";

export interface BasicService {
    totalDbt?: number;
    minAmount?: number;
    commission?: number;
    client?: Client;
}