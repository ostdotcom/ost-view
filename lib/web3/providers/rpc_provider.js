"use strict";

const Web3 = require('web3');

var web3UtilityRpcProvider = {
	 getRPCproviderInstance : function(rpcProvider){
	 	return new Web3(rpcProvider);
	 }
}

module.exports = web3UtilityRpcProvider;
