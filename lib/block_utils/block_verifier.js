"use strict"

/**
  * File: block_verifier
  * It provides block verifier object to confirm blocks of the block chain.
  * Author: Sachin
  */

const reqPrefix           = "../.."
    , logger              = require( reqPrefix + "/helpers/CustomConsoleLogger")
    , erctoken            = require( reqPrefix + "/lib/contract_interact/erc20Token")
    , constants           = require( reqPrefix + "/config/core_constants")
    , BlockFetcher        = require( reqPrefix + "/lib/block_utils/block_fetcher")
    ;

const LARGEST_NUMBER = 1000000000;
const BlockVerifier = function(web3Interact, dbInteract) {
	this.web3Interact = web3Interact;
    this.dbInteract = dbInteract;
}

BlockVerifier.prototype.verifyBlock = function(blockNumber, verificationCompleteCallback) {
    logger.info('**Verifying Block**');

    this.callback = verificationCompleteCallback;
    var oThis = this;

    oThis.isBlockVerified(blockNumber)
    	.then((verified) => {
    		if( !verified ) {	
    			return oThis.checkForBlockHash(blockNumber)
		    		.then((consistent) => {
		    			logger.log("Block hash consistency :", consistent);
		    			if (consistent) {
			    			return oThis.dbInteract.updateVerifiedFlag(blockNumber);
			    		} else {
			    			return oThis.correctBlockInconsistency(blockNumber);
			    		}
			    	})
    		}
    	})
    	.then(() => { oThis.callback(+blockNumber + 1) })
    	.catch((err)=> {
    		logger.error(err);
    		oThis.callback(blockNumber);
    	});
}

BlockVerifier.prototype.checkForBlockHash = function(blockNumber) {
	logger.info('**Checking for block hash**');
	
	var oThis = this;

	return new Promise((resolve, reject) => {
		oThis.web3Interact.getBlock(blockNumber)
			.then((response) => {
				const web3BlockHash = response.data.hash;
				oThis.dbInteract.getBlock(blockNumber)
					.then((response)=>{
						if (response[0].hash) {
							logger.info('web3 hash and db hash :', web3BlockHash, response[0].hash);
							resolve(web3BlockHash == response[0].hash);
						} else {
							reject("hash of response not defined");
						}
					});
			});
	});
}

BlockVerifier.prototype.isBlockVerified = function(blockNumber) {
	
	var oThis = this;

	return new Promise((resolve, reject) =>{
		oThis.dbInteract.getBlock(blockNumber)
			.then((response) => {
				if (response[0]) {
					resolve(response[0].verified)
				} else {
					reject('verified attribute of response not defined');
				}
			});
	});
}

BlockVerifier.prototype.correctBlockInconsistency = function(blockNumber) {

	var oThis = this;

	return new Promise((resolve,reject)=>{
		// Delete Block Related data
		oThis.deleteAllDataForBlock(blockNumber)
			.then(()=> {
				var blockFetcher = BlockFetcher.newInstance(oThis.web3Interact, oThis.dbInteract, true);
				blockFetcher.fetchBlock(blockNumber, (res)=>{
					resolve();
				});
			});
	});
}

BlockVerifier.prototype.deleteAllDataForBlock = function(blockNumber) {

	var oThis = this;

	return new Promise((resolve, reject)=>{

		oThis.dbInteract.deleteBlock(blockNumber)
		oThis.dbInteract.getBlockTransactions(blockNumber, 1, LARGEST_NUMBER)
			.then((response)=>{
				var txnHashArray = [];
				if (response.constructor === Array) {
					for (var ind in response) {
						var txn = response[ind];
						txnHashArray.push(txn.hash);
					}
				}
				logger.log('Transactions to be deleted :', txnHashArray);

				var promiseList = [];
				
				var addressTokenTransactions = oThis.dbInteract.deleteAddressTokenTransactions(txnHashArray);
				promiseList.push(addressTokenTransactions);

				var tokenTransactions = oThis.dbInteract.deleteTokenTransactions(txnHashArray);
				promiseList.push(tokenTransactions);		

				var addressTransactions = oThis.dbInteract.deleteAddressTransactions(txnHashArray);
				promiseList.push(addressTransactions);

				var transactions = oThis.dbInteract.deleteTransactions(txnHashArray);
				promiseList.push(transactions);

				Promise.all(promiseList)
					.then((response)=>{
						logger.log(response);
						resolve();
					});
			});
	});
}

module.exports = {
    newInstance: function(web3Interact, dbInteract) {
        return new BlockVerifier(web3Interact, dbInteract);
    } 
}