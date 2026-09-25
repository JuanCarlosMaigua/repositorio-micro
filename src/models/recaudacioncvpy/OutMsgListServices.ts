import { BasicResponse } from "../transaccioncvpy/common";
import { CVService } from "./Service";

export interface OutMsgListServices extends BasicResponse {
    service?: CVService[];
}