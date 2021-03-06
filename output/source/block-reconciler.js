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
exports.reconcileBlockHistory = void 0;
var utilities_1 = require("./utilities");
exports.reconcileBlockHistory = function (getBlockByHash, blockHistory, newBlock, onBlockAdded, onBlockRemoved, blockRetention) {
    if (blockRetention === void 0) { blockRetention = 100; }
    return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, blockHistory];
                case 1:
                    blockHistory = _a.sent();
                    if (!isFirstBlock(blockHistory)) return [3 /*break*/, 3];
                    return [4 /*yield*/, addNewHeadBlock(blockHistory, newBlock, onBlockAdded, blockRetention)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    if (!isOlderThanOldestBlock(blockHistory, newBlock)) return [3 /*break*/, 6];
                    return [4 /*yield*/, rollback(blockHistory, onBlockRemoved)];
                case 4:
                    blockHistory = _a.sent();
                    return [4 /*yield*/, addNewHeadBlock(blockHistory, newBlock, onBlockAdded, blockRetention)];
                case 5: return [2 /*return*/, _a.sent()];
                case 6:
                    if (isAlreadyInHistory(blockHistory, newBlock))
                        return [2 /*return*/, blockHistory];
                    if (!isNewHeadBlock(blockHistory, newBlock)) return [3 /*break*/, 8];
                    return [4 /*yield*/, addNewHeadBlock(blockHistory, newBlock, onBlockAdded, blockRetention)];
                case 7: return [2 /*return*/, _a.sent()];
                case 8:
                    if (!parentHashIsInHistory(blockHistory, newBlock)) return [3 /*break*/, 13];
                    _a.label = 9;
                case 9:
                    if (!(blockHistory.last().hash !== newBlock.parentHash)) return [3 /*break*/, 11];
                    return [4 /*yield*/, removeHeadBlock(blockHistory, onBlockRemoved)];
                case 10:
                    blockHistory = _a.sent();
                    return [3 /*break*/, 9];
                case 11: return [4 /*yield*/, addNewHeadBlock(blockHistory, newBlock, onBlockAdded, blockRetention)];
                case 12: return [2 /*return*/, _a.sent()];
                case 13: return [4 /*yield*/, backfill(getBlockByHash, blockHistory, newBlock, onBlockAdded, onBlockRemoved, blockRetention)];
                case 14: return [2 /*return*/, _a.sent()];
            }
        });
    });
};
var rollback = function (blockHistory, onBlockRemoved) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!!blockHistory.isEmpty()) return [3 /*break*/, 2];
                return [4 /*yield*/, removeHeadBlock(blockHistory, onBlockRemoved)];
            case 1:
                // CONSIDER: if this throws an exception, removals may have been announced that are actually still in history since throwing will result in no history update. we can't catch errors here because there isn't a clear way to recover from them, the failure may be a downstream system telling us that the block removal isn't possible because they are in a bad state. we could try re-announcing the successfully added blocks, but there would still be a problem with the failed block (should it be re-announced?) and the addition announcements may also fail
                blockHistory = _a.sent();
                return [3 /*break*/, 0];
            case 2: return [2 /*return*/, blockHistory];
        }
    });
}); };
var backfill = function (getBlockByHash, blockHistory, newBlock, onBlockAdded, onBlockRemoved, blockRetention) { return __awaiter(void 0, void 0, void 0, function () {
    var parentBlock;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(newBlock.parentHash ===
                    '0x0000000000000000000000000000000000000000000000000000000000000000')) return [3 /*break*/, 2];
                return [4 /*yield*/, rollback(blockHistory, onBlockRemoved)];
            case 1: return [2 /*return*/, _a.sent()];
            case 2: return [4 /*yield*/, getBlockByHash(newBlock.parentHash)];
            case 3:
                parentBlock = _a.sent();
                if (parentBlock === null)
                    throw new Error('Failed to fetch parent block.');
                if (!(utilities_1.parseHexInt(parentBlock.number) + blockRetention <
                    utilities_1.parseHexInt(blockHistory.last().number))) return [3 /*break*/, 5];
                return [4 /*yield*/, rollback(blockHistory, onBlockRemoved)];
            case 4: return [2 /*return*/, _a.sent()];
            case 5: return [4 /*yield*/, exports.reconcileBlockHistory(getBlockByHash, blockHistory, parentBlock, onBlockAdded, onBlockRemoved, blockRetention)];
            case 6:
                blockHistory = _a.sent();
                return [4 /*yield*/, exports.reconcileBlockHistory(getBlockByHash, blockHistory, newBlock, onBlockAdded, onBlockRemoved, blockRetention)];
            case 7: return [2 /*return*/, _a.sent()];
        }
    });
}); };
var addNewHeadBlock = function (blockHistory, newBlock, onBlockAdded, blockRetention) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                // this is here as a final sanity check, in case we somehow got into an unexpected state, there are no known (and should never be) ways to reach this exception
                if (!blockHistory.isEmpty() &&
                    blockHistory.last().hash !== newBlock.parentHash)
                    throw new Error("New head block's parent isn't our current head.");
                // CONSIDER: the user getting this notification won't have any visibility into the updated block history yet. should we announce new blocks in a `setTimeout`? should we provide block history with new logs? an announcement failure will result in unwinding the stack and returning the original blockHistory, if we are in the process of backfilling we may have already announced previous blocks that won't actually end up in history (they won't get removed if a re-org occurs and may be re-announced). we can't catch errors thrown by the callback because it may be trying to signal to use that the block has become invalid and is un-processable
                return [4 /*yield*/, onBlockAdded(newBlock)];
            case 1:
                // CONSIDER: the user getting this notification won't have any visibility into the updated block history yet. should we announce new blocks in a `setTimeout`? should we provide block history with new logs? an announcement failure will result in unwinding the stack and returning the original blockHistory, if we are in the process of backfilling we may have already announced previous blocks that won't actually end up in history (they won't get removed if a re-org occurs and may be re-announced). we can't catch errors thrown by the callback because it may be trying to signal to use that the block has become invalid and is un-processable
                _a.sent();
                blockHistory = blockHistory.push(newBlock);
                return [2 /*return*/, blockHistory.takeLast(blockRetention).toList()];
        }
    });
}); };
var removeHeadBlock = function (blockHistory, onBlockRemoved) { return __awaiter(void 0, void 0, void 0, function () {
    var removedBlock;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                removedBlock = blockHistory.last();
                blockHistory = blockHistory.pop();
                return [4 /*yield*/, onBlockRemoved(removedBlock)];
            case 1:
                _a.sent();
                return [2 /*return*/, blockHistory];
        }
    });
}); };
var isFirstBlock = function (blockHistory) {
    return blockHistory.isEmpty();
};
var isOlderThanOldestBlock = function (blockHistory, newBlock) {
    return (utilities_1.parseHexInt(blockHistory.first().number) > utilities_1.parseHexInt(newBlock.number));
};
var isAlreadyInHistory = function (blockHistory, newBlock) {
    // `block!` is required until the next version of `immutable` is published to NPM (current version 3.8.1) which improves the type definitions
    return blockHistory.some(function (block) { return block.hash === newBlock.hash; });
};
var isNewHeadBlock = function (blockHistory, newBlock) {
    return blockHistory.last().hash === newBlock.parentHash;
};
var parentHashIsInHistory = function (blockHistory, newBlock) {
    // `block!` is required until the next version of `immutable` is published to NPM (current version 3.8.1) which improves the type definitions
    return blockHistory.some(function (block) { return block.hash === newBlock.parentHash; });
};
//# sourceMappingURL=block-reconciler.js.map