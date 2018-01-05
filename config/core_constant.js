
"use strict";

const path = require('path')
  , rootPrefix = ".."
;

/*
 * Constants file: Load constants from environment variables
 *
 */

function define(name, value) {
  Object.defineProperty(exports, name, {
    value: value,
    enumerable: true
  });
}

define("ENVIRONMENT", process.env.ENVIRONMENT);


define('OST_GETH_UTILITY_RPC_PROVIDER', process.env.OST_GETH_UTILITY_RPC_PROVIDER);
