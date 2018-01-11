"use strict"


const reqPrefix           = "./"
	, db_config_141 	  = require(reqPrefix + "dbconfig/db_config_141");


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
    web_rpc       : "http://localhost:4545",
    cron_interval : 2000
}

// Adding chain with ID
addChainConfig('141', chain_141);

module.exports = chain_config;