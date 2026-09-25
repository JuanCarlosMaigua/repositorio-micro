// Actions
// Models

import {CajaVerdeActions, CajaVerdeActionTypes, StartSession, ViewVoucher} from '../_actions/caja-verde.actions';
import {ConfigModel} from '../_models/config.model';
import {TransactionModel} from '../_models/transaction.model';

export interface CajaVerdeState {
  deviceRegistered: boolean;
  sessionID: number;
  deviceId: number;
  deviceType: string;
  deviceConfigLoad: boolean;
  hasTransaction: boolean;
  transactions: TransactionModel[];
  transactionQR: TransactionModel;
  transactionVoucher: TransactionModel;
  deviceConfig: ConfigModel;
}

export const initialCajaVerdeState: CajaVerdeState = {
  deviceRegistered: false,
  sessionID: 0,
  deviceId: 0,
  deviceType: 'Desktop',
  deviceConfigLoad: false,
  hasTransaction: false,
  transactions: [],
  deviceConfig: new ConfigModel(),
  transactionQR: new TransactionModel(),
  transactionVoucher: new TransactionModel(),
};

export function cajaVerdeReducer(state = initialCajaVerdeState, action: CajaVerdeActions): CajaVerdeState {
  switch (action.type) {
    case CajaVerdeActionTypes.RegisterDevice : {
      const deviceId: number = action.payload.deviceId;
      const deviceType: string = action.payload.deviceType;
      const sessionID: number = action.payload.sessionID;
      const deviceConfig: ConfigModel = action.payload.config;
      return {
        ...state,
        deviceRegistered: true,
        deviceConfigLoad: true,
        deviceId,
        deviceType,
        deviceConfig,
        sessionID
      };
    }
    case CajaVerdeActionTypes.StartSession : {
      const deviceId: number = action.payload.deviceId;
      const sessionID: number = action.payload.sessionID;
      const deviceConfig: ConfigModel = action.payload.config;
      return {
        ...state,
        deviceRegistered: true,
        deviceConfigLoad: true,
        deviceConfig,
        deviceId,
        sessionID
      };
    }
    case CajaVerdeActionTypes.HasTransactions : {
      const transactions: TransactionModel[] = action.payload.transactions;
      return {
        ...state,
        hasTransaction: true,
        transactions
      };
    }
    case CajaVerdeActionTypes.viewQR : {
      const transactionQR: TransactionModel = action.payload.transaction;
      return {
        ...state,
        hasTransaction: true,
        transactionQR
      };
    }
    case CajaVerdeActionTypes.viewVoucher : {
      const transactionVoucher: TransactionModel = action.payload.transaction;
      return {
        ...state,
        transactionVoucher
      };
    }
    default:
      return state;
  }
}
