export declare type rxData = ArrayBuffer;
export declare const STATE_NEXT = 0;
export declare const STATE_ERROR = 1;
export declare const STATE_COMPLETE = 2;
export declare const STATE_SUBSCRIBE = 3;
export declare const STATE_DISPOSE = 4;
export interface RxImpMessage {
    id: string;
    topic: string;
    count: number;
    rx_state: number;
    payload?: string;
}
