import { Observable, Subject, ConnectableObservable, defer, Subscription } from 'rxjs';
import { rxData, RxImpMessage, STATE_NEXT, STATE_SUBSCRIBE, STATE_ERROR, STATE_COMPLETE, STATE_DISPOSE } from './rx-imp.model';
import { map, publish, filter, takeWhile, publishReplay, tap, shareReplay, share, takeUntil, take } from 'rxjs/operators';
import * as uuid from 'uuid';



export class RxImp {



    private _in: ConnectableObservable<RxImpMessage>;
    private _out: Subject<RxImpMessage>;

    public constructor(
        private inStream: Observable<rxData>,
        private outStream: Subject<rxData>
    ) {
        this._in =
            <ConnectableObservable<RxImpMessage>>inStream.pipe(
                map(this.mapIncoming),
                publish()
            );
        this._in.connect();
        this._in.subscribe({
            error: (err) => console.log("Unexpected Error in IN Observable: " + err),
        })
        this._out = new Subject();
        this._out.pipe(
            map(this.mapOutgoing)
        ).subscribe({
            next: (next) => {
                outStream.next(next);
            },
            error: (err) => {
                console.log(err);
            }
        })
    }


    public observableCall<T>(topic: string, payload: any): Observable<T> {

        const msg: RxImpMessage = {
            id: uuid.v4(),
            topic: topic,
            rx_state: STATE_SUBSCRIBE,
            count: 0,
            payload: JSON.stringify(payload),
        };

        return new Observable<T>(observer => {
            const subscription = this._in.pipe(
                filter(recvMsg => recvMsg.id === msg.id),
                filter(recvMsg => recvMsg.rx_state !== STATE_SUBSCRIBE),
                map(this._checkError),
                takeWhile(this._checkNotComplete),
                map(recvMsg => {
                    if (recvMsg.payload) {
                        return <T>JSON.parse(recvMsg.payload as string)
                    }
                    else {
                        return {} as T;
                    }
                }),
                share(),
            ).subscribe(observer);
            this._out.next(msg);

            return () => {
                subscription.unsubscribe();
                const unsubscribeMsg: RxImpMessage = {
                    id: msg.id,
                    topic: msg.topic,
                    count: 0,
                    rx_state: STATE_DISPOSE
                }
                this._out.next(unsubscribeMsg);
            }
        });
    }

    public registerCall<T>(topic: string, handler: (arg: T) => Observable<T>): Subscription {
        return this._in.pipe(
            filter(msg => msg.rx_state === STATE_SUBSCRIBE),
            filter(msg => msg.topic === topic)
        ).subscribe(msg => {
            let obs;
            if (msg.payload) {
                obs = handler(JSON.parse(msg.payload));
            } else {
                obs = handler(JSON.parse("{}"));
            }
            obs.pipe(
                takeUntil(this._in.pipe(
                    filter(msg => msg.rx_state === STATE_DISPOSE),
                    filter(disposeMsg => disposeMsg.id === msg.id),
                    take(1))
                )
            ).subscribe(
                {
                    next: nxt => {
                        const nxtMsg: RxImpMessage = {
                            id: msg.id,
                            topic: msg.topic,
                            count: 0,
                            rx_state: STATE_NEXT,
                            payload: JSON.stringify(nxt),
                        }
                        this._out.next(nxtMsg);
                    },
                    error: err => {
                        const errMsg: RxImpMessage = {
                            id: msg.id,
                            topic: msg.topic,
                            count: 0,
                            rx_state: STATE_ERROR,
                            payload: JSON.stringify(err.message),
                        }
                        this._out.next(errMsg);
                    },
                    complete: () => {
                        const cmplMsg: RxImpMessage = {
                            id: msg.id,
                            topic: msg.topic,
                            count: 0,
                            rx_state: STATE_COMPLETE
                        }
                        this._out.next(cmplMsg);
                    }
                }
            );
        });
    }

    private _checkError(msg: RxImpMessage): RxImpMessage {
        if (msg.rx_state === STATE_ERROR) {
            throw new Error(msg.payload as string)
        } else {
            return msg;
        }
    }

    private _checkNotComplete(msg: RxImpMessage): boolean {
        return msg.rx_state !== STATE_COMPLETE;
    }

    private mapIncoming(data: rxData): RxImpMessage {
        if ('TextDecoder' in window) {
            let utf8Decoder = new TextDecoder();
            return JSON.parse(utf8Decoder.decode(data));
        } else {
            return JSON.parse(String.fromCharCode.apply(null, Array.from(new Uint8Array(data))));
        }
   
    }


    public static toArrayBuffer(str: string): ArrayBuffer {
        const stringLength = str.length;
        const buffer = new ArrayBuffer(stringLength);
        const bufferView = new Uint8Array(buffer);
        for (let i = 0; i < stringLength; i++) {
            bufferView[i] = str.charCodeAt(i);
        }
        return buffer;
    }

    private mapOutgoing(msg: RxImpMessage): rxData {
        const str = JSON.stringify(msg);
        return RxImp.toArrayBuffer(str);
    }







}