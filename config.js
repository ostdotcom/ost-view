"use strict";

/*
 * OpenST Explorer configuration file:
 *
 * Explorer is built to work with multiple OpenST utility chains
 */

//Chain config
const chain_config = {
  '141': {
    chainId: 141,
    database_type: "mysql",
    web_rpc: "http://localhost:8545",
    poll_interval: 2000,
    db_config: {
      chainId: 141,
      driver: 'mysql',
      user: 'root',
      password: 'root',
      host: 'localhost',
      database: 'ost_staging_explorer',
      connectionLimit: 10,
      blockAttributes: ['miner', 'difficulty', 'totalDifficulty', 'gasLimit', 'gasUsed'],
      txnAttributes: ['gas', 'gasPrice', 'input', 'nonce', 'contractAddress']
    },
    //company_token id should be in consecutive order as per the index
    company_token_addresses: [
      {
        id: 1,
        company_name: 'Pepo',
        contract_address: '0x89AFC2d64c22e555c46345cE31c4Bb6de398a50b',
        company_symbol: 'Pepo',
        price: 3,
        token_holders: 0,
        market_cap: 0,
        circulation: 0,
        total_supply:0
      }
    ]
  },

  '142': {
    chainId: 142,
    database_type: "mysql",
    web_rpc: "http://localhost:9546",
    poll_interval: 2,
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
    },
    company_token_addresses: [
      {
        id: 1,
        company_name: 'Pepo',
        contract_address: '0x89AFC2d64c22e555c46345cE31c4Bb6de398a50b',
        company_symbol: 'Pepo',
        price: '3',
        token_holders: 0,
        market_cap: 0,
        circulation: 0,
        total_supply:0
      }
    ]
  },
  '1410': {
      chainId: 1410,
      database_type: "mysql",
      web_rpc: "http://127.0.0.1:8545",
      poll_interval: 1,
      db_config: {
        chainId: 1410,
        driver: 'mysql',
        user: 'root',
        password: 'root',
        host: 'localhost',
        database: 'ost_explorer_1410',
        connectionLimit: 10,
        blockAttributes: ['miner', 'difficulty', 'totalDifficulty', 'gasLimit', 'gasUsed'],
        txnAttributes: ['gas', 'gasPrice', 'input', 'nonce', 'contractAddress']
      },
      company_token_addresses: [
        {
          id: 1,
          company_name: 'Pepo',
          contract_address: '0x',
          company_symbol: 'Pepo',
          price: '3',
          token_holders: 0,
          market_cap: 0,
          circulation: 0,
          total_supply:0
        }
    ]
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
  },

  getContractIdMap: function(chainId) {
      if(this.getChainConfig(chainId)) {
        var map = {};
        this.getChainConfig(chainId).company_token_addresses.forEach(function(addresses){
          map[addresses.contract_address] = addresses.id;
        });
        map[0] = 0; //For no contract address
        return map;
      }
      return null;
  }
};