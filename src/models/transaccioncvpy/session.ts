import { BasicResponse } from './common';
import { Device,Configuration } from './device';
export interface Session extends Device {
  sessionId?: number;
  ipAgency?: number;
  ip?: string;
}

export interface InMsgLogin {
  session: Session;
}

export interface OutMsgLogin extends BasicResponse {
  session?: Session;
  configuration?: Configuration;
}