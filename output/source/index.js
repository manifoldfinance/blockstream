"use strict";
// NOTE --
//  Commented out to avoid cross origin error produced when running again webpack
//  More research is necessary to resolve, as it may simply be a configuration issue.
//  Repro Steps: Checkout augur `new-contracts` branch + run `yarn dev` to start the dev server.
//  When accessing within a browser, attempts to get files via XHR produces cross origin errors due the proto being `webpack-internal`
// import * as sourceMapSupport from "source-map-support";
// sourceMapSupport.install();
Object.defineProperty(exports, "__esModule", { value: true });
var block_and_log_streamer_1 = require("./block-and-log-streamer");
Object.defineProperty(exports, "BlockAndLogStreamer", { enumerable: true, get: function () { return block_and_log_streamer_1.BlockAndLogStreamer; } });
//# sourceMappingURL=index.js.map