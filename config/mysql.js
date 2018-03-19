"use strict";

const rootPrefix = '..'
  , coreConstants = require(rootPrefix + '/config/core_constants');

const mysqlConfig = {
  "commonNodeConfig": {
    "connectionLimit": coreConstants.MYSQL_CONNECTION_POOL_SIZE,
    "charset": "UTF8_UNICODE_CI",
    "bigNumberStrings": true,
    "supportBigNumbers": true,
    "dateStrings": true,
    "debug": false
  },
  "commonClusterConfig": {
    "canRetry": true,
    "removeNodeErrorCount": 5,
    "restoreNodeTimeout": 10000,
    "defaultSelector": "RR"
  },
  "clusters": {
    "cluster1": {
      "master": {
        "host": coreConstants.DEFAULT_MYSQL_HOST,
        "user": coreConstants.DEFAULT_MYSQL_USER,
        "password": coreConstants.DEFAULT_MYSQL_PASSWORD
      }
    },
    "cluster2": {
      "master": {
        "host": coreConstants.DEFAULT_MYSQL_HOST,
        "user": coreConstants.DEFAULT_MYSQL_USER,
        "password": coreConstants.DEFAULT_MYSQL_PASSWORD
      }
    }
  },
  "databases":{

  }
};
mysqlConfig["databases"]["ost_explorer_"+coreConstants.CHAIN_ID] = ["cluster1"];

module.exports = mysqlConfig;