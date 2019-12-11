"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var rx_imp_model_1 = require("./rx-imp.model");
var operators_1 = require("rxjs/operators");
var uuid = __importStar(require("uuid"));
var RxImp = (function () {
    function RxImp(inStream, outStream) {
        this.inStream = inStream;
        this.outStream = outStream;
        this._in =
            inStream.pipe(operators_1.map(this.mapIncoming), operators_1.publish());
        this._in.connect();
        this._in.subscribe({
            error: function (err) { return console.log("Unexpected Error in IN Observable: " + err); },
        });
        this._out = new rxjs_1.Subject();
        this._out.pipe(operators_1.map(this.mapOutgoing)).subscribe({
            next: function (next) {
                outStream.next(next);
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
    RxImp.prototype.observableCall = function (topic, payload) {
        var _this = this;
        var msg = {
            id: uuid.v4(),
            topic: topic,
            rx_state: rx_imp_model_1.STATE_SUBSCRIBE,
            count: 0,
            payload: JSON.stringify(payload),
        };
        return rxjs_1.defer(function () {
            var obs = _this._in.pipe(operators_1.filter(function (recvMsg) { return recvMsg.id === msg.id; }), operators_1.map(_this._checkError), operators_1.takeWhile(_this._checkNotComplete), operators_1.map(function (recvMsg) {
                if (recvMsg.payload) {
                    return JSON.parse(recvMsg.payload);
                }
                else {
                    return {};
                }
            }), operators_1.publishReplay());
            obs.connect();
            _this._out.next(msg);
            return obs;
        });
    };
    RxImp.prototype.registerCall = function (topic, handler) {
        var _this = this;
        return this._in.pipe(operators_1.filter(function (msg) { return msg.rx_state === rx_imp_model_1.STATE_SUBSCRIBE; }), operators_1.filter(function (msg) { return msg.topic === topic; })).subscribe(function (msg) {
            var subject = new rxjs_1.Subject();
            subject.subscribe({
                next: function (nxt) {
                    var nxtMsg = {
                        id: msg.id,
                        topic: msg.topic,
                        count: 0,
                        rx_state: rx_imp_model_1.STATE_NEXT,
                        payload: JSON.stringify(nxt),
                    };
                    _this._out.next(nxtMsg);
                },
                error: function (err) {
                    var errMsg = {
                        id: msg.id,
                        topic: msg.topic,
                        count: 0,
                        rx_state: rx_imp_model_1.STATE_ERROR,
                        payload: JSON.stringify(err.message),
                    };
                    _this._out.next(errMsg);
                },
                complete: function () {
                    var cmplMsg = {
                        id: msg.id,
                        topic: msg.topic,
                        count: 0,
                        rx_state: rx_imp_model_1.STATE_COMPLETE
                    };
                    _this._out.next(cmplMsg);
                }
            });
            if (msg.payload) {
                handler(JSON.parse(msg.payload), subject);
            }
            else {
                handler(undefined, subject);
            }
        });
    };
    RxImp.prototype._checkError = function (msg) {
        if (msg.rx_state === rx_imp_model_1.STATE_ERROR) {
            throw new Error(msg.payload);
        }
        else {
            return msg;
        }
    };
    RxImp.prototype._checkNotComplete = function (msg) {
        return msg.rx_state !== rx_imp_model_1.STATE_COMPLETE;
    };
    RxImp.prototype.mapIncoming = function (data) {
        return JSON.parse(String.fromCharCode.apply(null, Array.from(new Uint16Array(data))));
    };
    RxImp.toArrayBuffer = function (str) {
        var stringLength = str.length;
        var buffer = new ArrayBuffer(stringLength * 2);
        var bufferView = new Uint16Array(buffer);
        for (var i = 0; i < stringLength; i++) {
            bufferView[i] = str.charCodeAt(i);
        }
        return buffer;
    };
    RxImp.prototype.mapOutgoing = function (msg) {
        var str = JSON.stringify(msg);
        return RxImp.toArrayBuffer(str);
    };
    return RxImp;
}());
exports.RxImp = RxImp;
