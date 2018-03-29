"use strict";

/*
 * OpenST Explorer configuration file:
 *
 * Explorer is built to work with multiple OpenST utility chains
 */

//Chain config
const chain_config = {

};

(function setUpChainFromEnv() {
  var i = 0;
  while(true) {

    var ostView = "OST_VIEW_" + i;
    var chainId = process.env[ostView + "_CHAIN_ID"];
    if (undefined === chainId) {
      break;
    }

    var chainIdValue = {
      chainId: chainId,
      database_type: "mysql",
      web_rpc: process.env[ostView + "_WEB_RPC"],
      poll_interval: 1,
      db_config: {
        chainId: chainId,
        driver: 'mysql',
        user: process.env[ostView + "_DB_USER"],
        password: process.env[ostView + "_DB_PWD"],
        host: process.env[ostView + "_DB_HOST"],
        database: process.env[ostView + "_DB_NAME"],
        connectionLimit: process.env[ostView + "_DB_CONNECTION_LIMIT"],
        blockAttributes: ['miner', 'difficulty', 'totalDifficulty', 'gasLimit', 'gasUsed'],
        txnAttributes: ['gas', 'gasPrice', 'input', 'nonce', 'contractAddress']
      },
      mysqlConfig: {
        dbName: process.env[ostView + "_DB_NAME"],
        "clusters": {
          "cluster1": {
            "master": {
              "host": process.env[ostView + "_DB_HOST"],
              "user": process.env[ostView + "_DB_USER"],
              "password": process.env[ostView + "_DB_PWD"]
            }
          }
        },
        "databases": {

        }
      }
    };
    chainIdValue.mysqlConfig.databases[process.env[ostView + "_DB_NAME"]] = ["cluster1"];
    chain_config[chainId] = chainIdValue;
    i++;
  }

})();

module.exports = {

  getChainConfig: function(chainId) {
    return chain_config[chainId];
  },

  getChainDbConfig: function(chainId) {
    if (this.getChainConfig(chainId)) {
      return this.getChainConfig(chainId).db_config;
    }
  },

  getMysqlDbConfig: function(chainId) {
    if (this.getChainConfig(chainId)) {
      return this.getChainConfig(chainId).mysqlConfig;
    }
  },

  getCommonNodeConfig : function() {
    return {
      "connectionLimit": process.env['OST_VIEW_0_DB_CONNECTION_LIMIT'],
      "charset": "UTF8_UNICODE_CI",
      "bigNumberStrings": true,
      "supportBigNumbers": true,
      "dateStrings": true,
      "debug": false
    };
  },

  getCommonClusterConfig : function () {
    return {
      "canRetry": true,
      "removeNodeErrorCount": 5,
      "restoreNodeTimeout": 10000,
      "defaultSelector": "RR"
    }
  },

  getWebRpcUrl: function(chainId) {
    if (this.getChainConfig(chainId)) {
      return this.getChainConfig(chainId).web_rpc;
    }
  },

  getAllChainIDs: function() {
    return Object.keys(chain_config);
  }
};
