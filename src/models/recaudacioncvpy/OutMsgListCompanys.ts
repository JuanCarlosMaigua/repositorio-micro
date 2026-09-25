import { BasicResponse } from "../transaccioncvpy/common";
import { Company } from "../transaccioncvpy/company";

export interface OutMsgListCompanys extends BasicResponse {
    companys?: Company[];
}