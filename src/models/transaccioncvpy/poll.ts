import { BasicResponse } from './common';

export interface Poll {
    pollId?: number;
    liked?: boolean;
    comment?: string;
    typeNemonic?: string;
}

export interface InMsgSavePoll {
    poll: Poll;
}

export interface OutMsgSavePoll extends BasicResponse {
    poll?: Poll;
}