"use strict"

/*
 * configProvider file: Load configProvider
 * Author: Sachin
 */

 //Chain config
const chain_config = {
	'141': {
		chainId       : 141,
    	database_type : "mysql", 
    	web_rpc       : "http://localhost:8545",
    	cron_interval : 2000,
    	db_config     : {
    		driver    		: process.env.OST_EXP_DB_DRIVER,
		    user      		: process.env.OST_EXP_DB_USER,
		    password  		: process.env.OST_EXP_DB_PWD,
		    host      		: process.env.OST_EXP_DB_HOST,
		    database  		: process.env.OST_EXP_DB_NAME,
		    blockAttributes : ['miner','difficulty','totalDifficulty','gasLimit','gasUsed'],
		    txnAttributes   : ['gas', 'gasPrice', 'input','nonce', 'contractAddress']	
    	}
	},

	'142': {
		chainId       : 142,
    	database_type : "mysql",
	    web_rpc       : "http://localhost:9546",
	    cron_interval : 2000,
    	db_config     : {
    		driver    		: 'mysql',
		    user      		: 'root',
		    password  		: 'root',
		    host      		: 'localhost',
		    database  		: 'ost_explorer_142',
		    blockAttributes : ['miner','difficulty','totalDifficulty','gasLimit','gasUsed'],
		    txnAttributes   : ['gas', 'gasPrice', 'input','nonce', 'contractAddress']	
    	}
	},

	'1410': {
		chainId       : 1410,
    	database_type : "mysql", 
    	web_rpc       : "http://localhost:8545",
    	cron_interval : 1,
    	db_config     : {
    		driver    		: 'mysql',
		    user      		: 'root',
		    password  		: 'root',
		    host      		: 'localhost',
		    database  		: 'ost_explorer_1410',
		    blockAttributes : ['miner','difficulty','totalDifficulty','gasLimit','gasUsed'],
		    txnAttributes   : ['gas', 'gasPrice', 'input','nonce', 'contractAddress']	
    	}
	},
}

module.exports = {
	
	getChainConfig(chainId) {
		return chain_config[chainId];
	},

	getChainDbConfig(chainId) {
		if (this.getChainConfig(chainId)) {
			return this.getChainConfig(chainId).db_config;
		}
		return undefined;
	},

	getWebRPC(chainId){
		if (this.getChainConfig(chainId)) {
			return this.getChainConfig(chainId).web_rpc;
		}
	},
};