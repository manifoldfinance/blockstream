"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHexInt = void 0;
exports.parseHexInt = function (value) {
    var result = Number.parseInt(value, 16);
    if (!Number.isFinite(result))
        throw new Error(value + " is not a hex encoded integer, parsing returned " + result + ".");
    return result;
};
//# sourceMappingURL=utilities.js.map