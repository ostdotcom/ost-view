"use strict"


const reqPrefix           = "./"
	, db_config_141 	  = require(reqPrefix + "dbconfig/db_config_141")
	, db_config_142 	  = require(reqPrefix + "dbconfig/db_config_142");


/*
 * configProvider file: Load configProvider
 * Author: Sachin
 */
const chain_config = {}

function addChainConfig(chainId, chainConfig) {
    chain_config[chainId] = chainConfig;
}


//Chain config
const chain_141 = {
    chainId       : 141,
    database_type : "mysql",
    db_config     : db_config_141, 
    web_rpc       : "http://localhost:8545",
    cron_interval : 2000
}

const chain_142 = {
    chainId       : 142,
    database_type : "mysql",
    db_config     : db_config_142, 
    web_rpc       : "http://localhost:9546",
    cron_interval : 2000
}

// Adding chain with ID
addChainConfig('141', chain_141);
addChainConfig('142', chain_142);

module.exports = {
	getChainConfig(chainId) {
		return chain_config[chainId];
	},

	getChainDbConfig(chainId) {
		if (this.getChainConfig(chainId)) {
			return this.getChainConfig(chainId).db_config;
		}
		return undefined;
	}
};