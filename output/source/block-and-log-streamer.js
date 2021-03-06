"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockAndLogStreamer = void 0;
var block_reconciler_1 = require("./block-reconciler");
var log_reconciler_1 = require("./log-reconciler");
var immutable_1 = require("immutable");
var createUuid = require("uuid");
var BlockAndLogStreamer = /** @class */ (function () {
    /**
     * @param getBlockByHash async function that returns a block given a particular hash or null/throws if the block is not found
     * @param getLogs async function that returns the logs matching the given filter
     * @param onError called if a subscriber throws an error, the error will otherwise be swallowed
     * @param configuration additional optional configuration items
     */
    function BlockAndLogStreamer(getBlockByHash, getLogs, onError, configuration) {
        var _this = this;
        this.lastKnownGoodBlockHistory = immutable_1.List();
        this.blockHistory = Promise.resolve(this.lastKnownGoodBlockHistory);
        this.lastKnownGoodLogHistory = immutable_1.List();
        this.logHistory = Promise.resolve(this.lastKnownGoodLogHistory);
        this.pendingCallbacks = [];
        this.onError = function () { };
        this.logFilters = {};
        this.onBlockAddedSubscribers = {};
        this.onBlockRemovedSubscribers = {};
        this.onLogsAddedSubscribers = {};
        this.onLogsRemovedSubscribers = {};
        this.reconcileNewBlock = function (block) { return __awaiter(_this, void 0, void 0, function () {
            var blockHistory, logHistory, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        this.blockHistory = block_reconciler_1.reconcileBlockHistory(this.getBlockByHash, this.blockHistory, block, this.onBlockAdded, this.onBlockRemoved, this.blockRetention);
                        return [4 /*yield*/, this.blockHistory];
                    case 1:
                        blockHistory = _a.sent();
                        return [4 /*yield*/, this.logHistory];
                    case 2:
                        logHistory = _a.sent();
                        // everything reconciled correctly, checkpoint state
                        this.lastKnownGoodBlockHistory = blockHistory;
                        this.lastKnownGoodLogHistory = logHistory;
                        this.pendingCallbacks.forEach(function (callback) { return callback(); });
                        this.pendingCallbacks = [];
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        // NOTE: this catch block may be hit multiple times for a single failure root cause, thus we need to be careful to only do idempotent operations in here
                        // something went wrong, rollback to last checkpoint
                        this.blockHistory = Promise.resolve(this.lastKnownGoodBlockHistory);
                        this.logHistory = Promise.resolve(this.lastKnownGoodLogHistory);
                        this.pendingCallbacks = [];
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        this.onBlockAdded = function (block) { return __awaiter(_this, void 0, void 0, function () {
            var logFilters;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        Object.keys(this.onBlockAddedSubscribers)
                            .map(function (key) { return _this.onBlockAddedSubscribers[key]; })
                            .map(function (callback) { return logAndSwallowWrapper(callback, _this.onError); })
                            .forEach(function (callback) { return _this.pendingCallbacks.push(function () { return callback(block); }); });
                        logFilters = Object.keys(this.logFilters).map(function (key) { return _this.logFilters[key]; });
                        this.logHistory = log_reconciler_1.reconcileLogHistoryWithAddedBlock(this.getLogs, this.logHistory, block, this.onLogsAdded, logFilters, this.blockRetention);
                        return [4 /*yield*/, this.logHistory];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        this.onBlockRemoved = function (block) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logHistory = log_reconciler_1.reconcileLogHistoryWithRemovedBlock(this.logHistory, block, this.onLogsRemoved);
                        return [4 /*yield*/, this.logHistory];
                    case 1:
                        _a.sent();
                        Object.keys(this.onBlockRemovedSubscribers)
                            .map(function (key) { return _this.onBlockRemovedSubscribers[key]; })
                            .map(function (callback) { return logAndSwallowWrapper(callback, _this.onError); })
                            .forEach(function (callback) { return _this.pendingCallbacks.push(function () { return callback(block); }); });
                        return [2 /*return*/];
                }
            });
        }); };
        this.onLogsAdded = function (blockHash, logs) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                Object.keys(this.onLogsAddedSubscribers)
                    .map(function (key) { return _this.onLogsAddedSubscribers[key]; })
                    .map(function (callback) { return logAndSwallowWrapper(callback, _this.onError); })
                    .forEach(function (callback) {
                    return _this.pendingCallbacks.push(function () { return callback(blockHash, logs); });
                });
                return [2 /*return*/];
            });
        }); };
        this.onLogsRemoved = function (blockHash, logs) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                Object.keys(this.onLogsRemovedSubscribers)
                    .map(function (key) { return _this.onLogsRemovedSubscribers[key]; })
                    .map(function (callback) { return logAndSwallowWrapper(callback, _this.onError); })
                    .forEach(function (callback) {
                    return _this.pendingCallbacks.push(function () { return callback(blockHash, logs); });
                });
                return [2 /*return*/];
            });
        }); };
        this.getLatestReconciledBlock = function () {
            return _this.lastKnownGoodBlockHistory.isEmpty()
                ? null
                : _this.lastKnownGoodBlockHistory.last();
        };
        this.addLogFilter = function (filter) {
            var uuid = "log filter token " + createUuid();
            _this.logFilters[uuid] = filter;
            return uuid;
        };
        this.removeLogFilter = function (token) {
            if (!token.startsWith('log filter token '))
                throw new Error("Expected a log filter token.  Actual: " + token);
            delete _this.logFilters[token];
        };
        this.subscribeToOnBlockAdded = function (onBlockAdded) {
            var uuid = "on block added token " + createUuid();
            _this.onBlockAddedSubscribers[uuid] = onBlockAdded;
            return uuid;
        };
        this.unsubscribeFromOnBlockAdded = function (token) {
            if (!token.startsWith('on block added token '))
                throw new Error("Expected a block added subscription token.  Actual: " + token);
            delete _this.onBlockAddedSubscribers[token];
        };
        this.subscribeToOnBlockRemoved = function (onBlockRemoved) {
            var uuid = "on block removed token " + createUuid();
            _this.onBlockRemovedSubscribers[uuid] = onBlockRemoved;
            return uuid;
        };
        this.unsubscribeFromOnBlockRemoved = function (token) {
            if (!token.startsWith('on block removed token '))
                throw new Error("Expected a block added subscription token.  Actual: " + token);
            delete _this.onBlockRemovedSubscribers[token];
        };
        this.subscribeToOnLogsAdded = function (onLogsAdded) {
            var uuid = "on log added token " + createUuid();
            _this.onLogsAddedSubscribers[uuid] = onLogsAdded;
            return uuid;
        };
        this.unsubscribeFromOnLogsAdded = function (token) {
            if (!token.startsWith('on log added token '))
                throw new Error("Expected a log added subscription token.  Actual: " + token);
            delete _this.onLogsAddedSubscribers[token];
        };
        this.subscribeToOnLogsRemoved = function (onLogsRemoved) {
            var uuid = "on log removed token " + createUuid();
            _this.onLogsRemovedSubscribers[uuid] = onLogsRemoved;
            return uuid;
        };
        this.unsubscribeFromOnLogsRemoved = function (token) {
            if (!token.startsWith('on log removed token '))
                throw new Error("Expected a log added subscription token.  Actual: " + token);
            delete _this.onLogsRemovedSubscribers[token];
        };
        if (getBlockByHash === undefined)
            throw new Error("getBlockByHash must be provided");
        this.getBlockByHash = getBlockByHash;
        if (getLogs === undefined)
            throw new Error("getLogs must be provided");
        this.getLogs = getLogs;
        if (onError === undefined)
            throw new Error("onError must be provided");
        this.onError = onError;
        this.blockRetention =
            configuration && configuration.blockRetention
                ? configuration.blockRetention
                : 100;
    }
    return BlockAndLogStreamer;
}());
exports.BlockAndLogStreamer = BlockAndLogStreamer;
function logAndSwallowWrapper(callback, onError) {
    return function (parameter1, parameter2) {
        try {
            callback(parameter1, parameter2);
        }
        catch (error) {
            onError(error);
        }
    };
}
//# sourceMappingURL=block-and-log-streamer.js.map