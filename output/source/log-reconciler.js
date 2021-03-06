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
exports.reconcileLogHistoryWithRemovedBlock = exports.reconcileLogHistoryWithAddedBlock = void 0;
var utilities_1 = require("./utilities");
exports.reconcileLogHistoryWithAddedBlock = function (getLogs, logHistory, newBlock, onLogsAdded, filters, historyBlockLength) {
    if (filters === void 0) { filters = []; }
    if (historyBlockLength === void 0) { historyBlockLength = 100; }
    return __awaiter(void 0, void 0, void 0, function () {
        var logs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, logHistory];
                case 1:
                    logHistory = _a.sent();
                    return [4 /*yield*/, getFilteredLogs(getLogs, newBlock, filters)];
                case 2:
                    logs = _a.sent();
                    return [4 /*yield*/, addNewLogsToHead(newBlock.hash, logHistory, logs, onLogsAdded)];
                case 3:
                    logHistory = _a.sent();
                    return [4 /*yield*/, pruneOldLogs(logHistory, newBlock, historyBlockLength)];
                case 4:
                    logHistory = _a.sent();
                    return [2 /*return*/, logHistory];
            }
        });
    });
};
var getFilteredLogs = function (getLogs, newBlock, filters) { return __awaiter(void 0, void 0, void 0, function () {
    var logPromises, nestedLogs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logPromises = filters
                    .map(function (filter) { return ({
                    blockHash: newBlock.hash,
                    address: filter.address,
                    topics: filter.topics,
                }); })
                    .map(function (filter) { return getLogs(filter); });
                return [4 /*yield*/, Promise.all(logPromises)];
            case 1:
                nestedLogs = _a.sent();
                return [2 /*return*/, nestedLogs.reduce(function (allLogs, logs) { return allLogs.concat(logs); }, [])];
        }
    });
}); };
var addNewLogsToHead = function (blockHash, logHistory, newLogs, onLogsAdded) { return __awaiter(void 0, void 0, void 0, function () {
    var sortedLogs, addedLogs, _loop_1, _i, sortedLogs_1, logToAdd;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                sortedLogs = newLogs.sort(function (logA, logB) { return utilities_1.parseHexInt(logA.logIndex) - utilities_1.parseHexInt(logB.logIndex); });
                addedLogs = [];
                _loop_1 = function (logToAdd) {
                    // we may already have this log because two filters can return the same log
                    if (logHistory.some(function (logInHistory) {
                        return logInHistory.blockHash === logToAdd.blockHash &&
                            logInHistory.logIndex === logToAdd.logIndex;
                    }))
                        return "continue";
                    ensureOrder(logHistory.last(), logToAdd);
                    logHistory = logHistory.push(logToAdd);
                    addedLogs.push(logToAdd);
                };
                for (_i = 0, sortedLogs_1 = sortedLogs; _i < sortedLogs_1.length; _i++) {
                    logToAdd = sortedLogs_1[_i];
                    _loop_1(logToAdd);
                }
                // CONSIDER: the user getting this notification won't have any visibility into the updated log history yet. should we announce new logs in a `setTimeout`? should we provide log history with new logs?
                return [4 /*yield*/, onLogsAdded(blockHash, addedLogs)];
            case 1:
                // CONSIDER: the user getting this notification won't have any visibility into the updated log history yet. should we announce new logs in a `setTimeout`? should we provide log history with new logs?
                _a.sent();
                return [2 /*return*/, logHistory];
        }
    });
}); };
var pruneOldLogs = function (logHistory, newBlock, historyBlockLength) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        // `log!` is required until the next major version of `immutable` is published to NPM (current version 3.8.2) which improves the type definitions
        return [2 /*return*/, logHistory
                .skipUntil(function (log) {
                return utilities_1.parseHexInt(newBlock.number) - utilities_1.parseHexInt(log.blockNumber) <
                    historyBlockLength;
            })
                .toList()];
    });
}); };
var ensureOrder = function (headLog, newLog) {
    if (headLog === undefined)
        return;
    var headBlockNumber = utilities_1.parseHexInt(headLog.blockNumber);
    var newLogBlockNumber = utilities_1.parseHexInt(newLog.blockNumber);
    if (headBlockNumber > newLogBlockNumber)
        throw new Error("received log for a block (" + newLogBlockNumber + ") older than current head log's block (" + headBlockNumber + ")");
    if (headBlockNumber !== newLogBlockNumber)
        return;
    var headLogIndex = utilities_1.parseHexInt(headLog.logIndex);
    var newLogIndex = utilities_1.parseHexInt(newLog.logIndex);
    if (headLogIndex >= newLogIndex)
        throw new Error("received log with same block number (" + newLogBlockNumber + ") but index (" + newLogIndex + ") is the same or older than previous index (" + headLogIndex + ")");
};
exports.reconcileLogHistoryWithRemovedBlock = function (logHistory, removedBlock, onLogsRemoved) { return __awaiter(void 0, void 0, void 0, function () {
    var removedLogs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, logHistory];
            case 1:
                logHistory = _a.sent();
                removedLogs = [];
                while (!logHistory.isEmpty() &&
                    logHistory.last().blockHash === removedBlock.hash) {
                    removedLogs.push(logHistory.last());
                    logHistory = logHistory.pop();
                }
                return [4 /*yield*/, onLogsRemoved(removedBlock.hash, removedLogs)];
            case 2:
                _a.sent();
                // sanity check, no known way to trigger the error
                if (logHistory.some(function (log) { return log.blockHash === removedBlock.hash; }))
                    throw new Error('found logs for removed block not at head of log history');
                return [2 /*return*/, logHistory];
        }
    });
}); };
//# sourceMappingURL=log-reconciler.js.map