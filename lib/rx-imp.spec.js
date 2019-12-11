"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rx_imp_1 = require("./rx-imp");
var rxjs_1 = require("rxjs");
var rx_imp_model_1 = require("./rx-imp.model");
var testing_1 = require("rxjs/testing");
var inSubject;
var outSubject;
var rxImp;
var TEST_TOPIC = "/test/topic";
var testScheduler = new testing_1.TestScheduler(function (actual, expected) {
    expect(actual).toEqual(expected);
});
describe("rxImp", function () {
    beforeEach(function () {
        inSubject = new rxjs_1.ReplaySubject();
        outSubject = new rxjs_1.ReplaySubject();
        rxImp = new rx_imp_1.RxImp(inSubject, outSubject);
    });
    it("sends subscribe message on observable call", function () {
        testScheduler.run(function (helpers) {
            var hot = helpers.hot, expectObservable = helpers.expectObservable, expectSubscriptions = helpers.expectSubscriptions;
            var e1 = 'a';
            var values = {
                a: rx_imp_1.RxImp.toArrayBuffer("Hello World"),
            };
            rxImp.observableCall(TEST_TOPIC, JSON.stringify("Hello World")).subscribe();
            expectObservable(outSubject).toBe(e1, values);
        });
    });
    it("catches observable call", function () {
        testScheduler.run(function (helpers) {
            var expectObservable = helpers.expectObservable;
            var tester = new rxjs_1.ReplaySubject();
            rxImp.registerCall(TEST_TOPIC, function (data, publisher) {
                tester.next(true);
                publisher.next(data);
                publisher.complete();
            });
            var testMsg = {
                id: "grej9g",
                topic: TEST_TOPIC,
                count: 0,
                rx_state: rx_imp_model_1.STATE_SUBSCRIBE,
                payload: JSON.stringify("Hello World")
            };
            inSubject.next(rxImp['mapOutgoing'](testMsg));
            expectObservable(tester).toBe('a', { a: true });
        });
    });
    it("creates a simple / local connect", function () {
        testScheduler.run(function (helpers) {
            var expectObservable = helpers.expectObservable;
            outSubject.subscribe({
                next: function (n) {
                    inSubject.next(n);
                },
                error: function (e) { return inSubject.error(e); },
                complete: function () { return inSubject.complete(); },
            });
            rxImp.registerCall(TEST_TOPIC, function (args, subj) {
                subj.next(args);
                subj.complete();
            });
            expectObservable(rxImp.observableCall(TEST_TOPIC, "Hello World")).toBe('(a|)', { a: "Hello World" });
        });
    });
    it("Throws errors", function () {
        testScheduler.run(function (helpers) {
            var expectObservable = helpers.expectObservable;
            outSubject.subscribe({
                next: function (n) {
                    inSubject.next(n);
                },
                error: function (e) { return inSubject.error(e); },
                complete: function () { return inSubject.complete(); },
            });
            rxImp.registerCall(TEST_TOPIC, function (args, subj) {
                subj.error(new Error("This is not what I wanted!"));
            });
            expectObservable(rxImp.observableCall(TEST_TOPIC, "Hello World")).toBe('#', null, new Error(JSON.stringify("This is not what I wanted!")));
        });
    });
});
