import { Cuenta } from './cuenta';
import { BasicResponse } from '../transaccioncvpy/common';

export interface OutMsgObtenerCuenta extends BasicResponse {
  account?: Cuenta;
}