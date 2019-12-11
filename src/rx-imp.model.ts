
export type rxData = ArrayBuffer;

export const STATE_NEXT = 0;
export const STATE_ERROR = 1;
export const STATE_COMPLETE = 2;
export const STATE_SUBSCRIBE = 3;
export const STATE_DISPOSE = 4;


export interface RxImpMessage {

    id: string;
    topic: string;
    count: number;
    rx_state: number;
    payload?: string;
}
