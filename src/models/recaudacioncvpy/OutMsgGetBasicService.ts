import { BasicResponse } from "../transaccioncvpy/common";
import { BasicService } from "./BasicService";

export interface OutMsgGetBasicService extends BasicResponse {
    basicService?: BasicService;
}