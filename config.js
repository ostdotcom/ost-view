"use strict";

/*
 * OpenST Explorer configuration file:
 *
 * Explorer is built to work with multiple OpenST utility chains
 */

//Chain config
const chain_config = {
  '2001': {
    chainId: 2001,
    database_type: "mysql",
    web_rpc: process.env.OST_VIEW_2001_WEB_RPC,
    poll_interval: 1,
    db_config: {
      chainId: 2001,
      driver: 'mysql',
      user: process.env.OST_VIEW_2001_DB_USER,
      password: process.env.OST_VIEW_2001_DB_PWD,
      host: process.env.OST_VIEW_2001_DB_HOST,
      database: process.env.OST_VIEW_2001_DB_NAME,
      connectionLimit: process.env.OST_VIEW_2001_DB_CONNECTION_LIMIT,
      blockAttributes: ['miner', 'difficulty', 'totalDifficulty', 'gasLimit', 'gasUsed'],
      txnAttributes: ['gas', 'gasPrice', 'input', 'nonce', 'contractAddress']
    }
  },

  '142': {
    chainId: 142,
    database_type: "mysql",
    web_rpc: "http://devUtilityChain.com:9546",
    poll_interval: 1,
    db_config: {
      chainId: 142,
      driver: 'mysql',
      user: 'root',
      password: 'root',
      host: 'localhost',
      database: 'ost_explorer_142',
      connectionLimit: 10,
      blockAttributes: ['miner', 'difficulty', 'totalDifficulty', 'gasLimit', 'gasUsed'],
      txnAttributes: ['gas', 'gasPrice', 'input', 'nonce', 'contractAddress']
    }
  },

  '2000': {
    chainId: 2000,
    database_type: "mysql",
    web_rpc: process.env.OST_VIEW_2000_WEB_RPC,
    poll_interval: 1,
    db_config: {
      chainId: 2000,
      driver: 'mysql',
      user: process.env.OST_VIEW_2000_DB_USER,
      password: process.env.OST_VIEW_2000_DB_PWD,
      host: process.env.OST_VIEW_2000_DB_HOST,
      database: process.env.OST_VIEW_2000_DB_NAME,
      connectionLimit: process.env.OST_VIEW_2000_DB_CONNECTION_LIMIT,
      blockAttributes: ['miner', 'difficulty', 'totalDifficulty', 'gasLimit', 'gasUsed'],
      txnAttributes: ['gas', 'gasPrice', 'input', 'nonce', 'contractAddress']
    }
  }
};

module.exports = {

  getChainConfig: function(chainId) {
    return chain_config[chainId];
  },

  getChainDbConfig: function(chainId) {
    if (this.getChainConfig(chainId)) {
      return this.getChainConfig(chainId).db_config;
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
