import { BasicResponse } from './common';

export interface Device {
  deviceId?: number;
  uuId: string;
  macAddress?: string;
  operatingSystem: string;
}

export interface InMsgSaveDevice {
  device: Device;
}

export interface Configuration {
  lifeTimeMobile: number;
  lifeTimeWeb: number;
  canTransactions: number;
  legalInformation: string;
  maxAmmount: string;
}

export interface OutMsgSaveDevice extends BasicResponse {
  configuration?: Configuration;
  device?: Device;
}