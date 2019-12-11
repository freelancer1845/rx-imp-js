import { Observable, Subject, Subscription } from 'rxjs';
import { rxData } from './rx-imp.model';
export declare class RxImp {
    private inStream;
    private outStream;
    private _in;
    private _out;
    constructor(inStream: Observable<rxData>, outStream: Subject<rxData>);
    observableCall<T>(topic: string, payload: any): Observable<T>;
    registerCall<T>(topic: string, handler: (parameter: T | undefined, publisher: Subject<T>) => void): Subscription;
    private _checkError;
    private _checkNotComplete;
    private mapIncoming;
    static toArrayBuffer(str: string): ArrayBuffer;
    private mapOutgoing;
}
