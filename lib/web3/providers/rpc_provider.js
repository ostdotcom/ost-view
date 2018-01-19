"use strict";

/**
 * RPC_Provider 
 * @module lib/providers/
 */

const Web3 = require('web3');

var web3UtilityRpcProvider = {
	 getRPCproviderInstance : function(rpcProvider){
		if (undefined == rpcProvider) {
			throw "RPC is undefined";
		}
	 	return new Web3(rpcProvider);
	 }
}

module.exports = web3UtilityRpcProvider;
