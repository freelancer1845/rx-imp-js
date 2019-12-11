import { RxImp } from './rx-imp';
import { Subject, BehaviorSubject, ReplaySubject } from 'rxjs';
import { rxData, RxImpMessage, STATE_SUBSCRIBE } from './rx-imp.model';
import { TestScheduler } from 'rxjs/testing';
import { promises } from 'dns';

let inSubject: Subject<rxData>;
let outSubject: Subject<rxData>;

let rxImp: RxImp;

const TEST_TOPIC = "/test/topic";

const testScheduler = new TestScheduler((actual, expected) => {
    // asserting the two objects are equal
    // e.g. using chai.
    expect(actual).toEqual(expected);
});

describe("rxImp", () => {
    beforeEach(() => {
        inSubject = new ReplaySubject<ArrayBuffer>();
        outSubject = new ReplaySubject<ArrayBuffer>();
        rxImp = new RxImp(inSubject, outSubject);
    });

    it("sends subscribe message on observable call", () => {
        testScheduler.run(helpers => {
            const { hot, expectObservable, expectSubscriptions } = helpers;
            const e1 = 'a';

            const values = {
                a: RxImp.toArrayBuffer("Hello World"),
            };
            rxImp.observableCall<string>(TEST_TOPIC, JSON.stringify("Hello World")).subscribe();
            expectObservable(outSubject).toBe(e1, values);
        });
    });

    it("catches observable call", () => {
        testScheduler.run(helpers => {
            const { expectObservable } = helpers;
            const tester = new ReplaySubject<boolean>();
            rxImp.registerCall<string>(TEST_TOPIC, (data, publisher) => {
                tester.next(true);
                publisher.next(data);
                publisher.complete();
            });

            const testMsg: RxImpMessage = {
                id: "grej9g",
                topic: TEST_TOPIC,
                count: 0,
                rx_state: STATE_SUBSCRIBE,
                payload: JSON.stringify("Hello World")
            }
            inSubject.next(rxImp['mapOutgoing'](testMsg));
            expectObservable(tester).toBe('a', { a: true });

        });
    });

    it("creates a simple / local connect", () => {
        testScheduler.run(helpers => {
            const { expectObservable } = helpers;

            outSubject.subscribe({
                next: n => {
                    inSubject.next(n);
                },
                error: e => inSubject.error(e),
                complete: () => inSubject.complete(),
            });
            rxImp.registerCall(TEST_TOPIC, (args, subj) => {
                subj.next(args);
                subj.complete();
            });
            expectObservable(rxImp.observableCall<string>(TEST_TOPIC, "Hello World")).toBe('(a|)', { a: "Hello World" });
        });
    });

    it("Throws errors", () => {
        testScheduler.run(helpers => {
            const { expectObservable } = helpers;

            outSubject.subscribe({
                next: n => {
                    inSubject.next(n);
                },
                error: e => inSubject.error(e),
                complete: () => inSubject.complete(),
            });
            rxImp.registerCall(TEST_TOPIC, (args, subj) => {
                subj.error(new Error("This is not what I wanted!"));
            });
            expectObservable(rxImp.observableCall<string>(TEST_TOPIC, "Hello World")).toBe('#', null, new Error(JSON.stringify("This is not what I wanted!")));
        });
    });
});