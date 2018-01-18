"use strict";

/*
 * DB interact: Interface File to interact with the DB.
 * Author: Sachin
 */

const MySQL = require('./mysql.js');
const constants = require('../../config/core_constants.js');
const logger = require('../CustomConsoleLogger');

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;

const DbHelper = function(dbObj){
	this.dbObject = dbObj;
} 

DbHelper.prototype = {

	getTransaction: function (transactionHash){

		return this.dbObject.selectTransaction(constants.TRANSACTION_TABLE_NAME, transactionHash);
	},

	getRecentBlocks: function (pageNumber, pageSize){
		if(undefined == pageNumber) {
			pageNumber = DEFAULT_PAGE_NUMBER;
		}
		if(undefined == pageSize) {
			pageSize = DEFAULT_PAGE_SIZE;
		}

		return this.dbObject.selectRecentBlocks(constants.BLOCK_TABLE_NAME, pageNumber, pageSize);
	},

	getBlock : function (blockNumber){
		if(undefined == blockNumber) {
			return;
		}

		return this.dbObject.selectBlock(constants.BLOCK_TABLE_NAME, blockNumber);
	},

	getAddressLedgerOfContract: function (address, contractAddress, pageNumber, pageSize){
		if(undefined == pageNumber) {
			pageNumber = DEFAULT_PAGE_NUMBER;
		}
		if(undefined == pageSize) {
			pageSize = DEFAULT_PAGE_SIZE;
		}

		return this.dbObject.selectAddressLedgerOfContract(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, address, contractAddress, pageNumber, pageSize);
	},

	getContractLedger: function (contractAddress, pageNumber, pageSize){
		if(undefined == pageNumber) {
			pageNumber = DEFAULT_PAGE_NUMBER;
		}
		if(undefined == pageSize) {
			pageSize = DEFAULT_PAGE_SIZE;
		}

		return this.dbObject.selectContractLedger(constants.TOKEN_TRANSACTION_TABLE_NAME, contractAddress, pageNumber, pageSize);
	},

	getHigestInsertedBlock: function ( blockNumber ) {
		return this.dbObject.selectHigestInsertedBlock(constants.BLOCK_TABLE_NAME);
	},

	getRecentTransactions: function ( pageNumber, pageSize) {
		if(undefined == pageNumber) {
			pageNumber = DEFAULT_PAGE_NUMBER;
		}
		if(undefined == pageSize) {
			pageSize = DEFAULT_PAGE_SIZE;
		}

		return this.dbObject.selectRecentTransactions(constants.TRANSACTION_TABLE_NAME, pageNumber, pageSize);
	},

	getBlockTransactions: function ( blockNumber, pageNumber, pageSize) {
		if(undefined == pageNumber) {
			pageNumber = DEFAULT_PAGE_NUMBER;
		}
		if(undefined == pageSize) {
			pageSize = DEFAULT_PAGE_SIZE;
		}

		return this.dbObject.selectBlockTransactions(constants.TRANSACTION_TABLE_NAME, blockNumber, pageNumber, pageSize);
	},

	getAddressTransactions: function( address, pageNumber, pageSize ) {
		if(undefined == pageNumber) {
			pageNumber = DEFAULT_PAGE_NUMBER;
		}
		if(undefined == pageSize) {
			pageSize = DEFAULT_PAGE_SIZE;
		}

		return this.dbObject.selectAddressTransactions(constants.ADDRESS_TRANSACTION_TABLE_NAME, address, pageNumber, pageSize);				
	},

	getAddressTokenTransactions: function( address, pageNumber, pageSize ) {
		if(undefined == pageNumber) {
			pageNumber = DEFAULT_PAGE_NUMBER;
		}
		if(undefined == pageSize) {
			pageSize = DEFAULT_PAGE_SIZE;
		}

		return this.dbObject.selectAddressTransactions(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, address, pageNumber, pageSize);				
	},

	insertBlock: function( blockDataArray ) {
		return this.dbObject.insertData(constants.BLOCK_TABLE_NAME, constants.BLOCKS_DATA_SEQUENCE, blockDataArray);				
	},

	insertTransaction: function( transactionDataArray ) {
		var oThis = this;
		return new Promise(function(resolve, reject){
			var result = [];
			var transactionPromiseList = [];
			var addressTransactionData = [];
			for (var ind in transactionDataArray) {
				var transactionData = transactionDataArray[ind];
				var transactionResponse =  oThis.dbObject.insertData(constants.TRANSACTION_TABLE_NAME, constants.TRANSACTION_DATA_SEQUENCE, transactionData);
				transactionPromiseList.push(transactionResponse);

				//Format transactions
				var txnArray = oThis.getAddressTransactionData( transactionData );
				txnArray.forEach((addrTxn)=>{
					addressTransactionData.push(addrTxn);
				});
			}

			logger.log(addressTransactionData);

			Promise.all(transactionPromiseList)
				.then(function(res){
				result.push(res);

				oThis.insertAddressTransaction(addressTransactionData)
					.then(function(res){
						result.push(res);
						resolve(result);	
					});
			});
		});
	},

	insertAddressTransaction: function( addressTransactionData) {
		return this.dbObject.insertData(constants.ADDRESS_TRANSACTION_TABLE_NAME, constants.ADDRESS_TRANSACTION_DATA_SEQUENCE, addressTransactionData);
	},

	insertTokenTransaction: function( tokenTransactionDataArray ) {
		var oThis = this;
		return new Promise(function(resolve, reject){
			var result = [];
			var transactionPromiseList = [];
			var addressTransactionData = [];
			for (var ind in tokenTransactionDataArray) {
				var tokenTransactionData = tokenTransactionDataArray[ind];
				var transactionResponse = oThis.dbObject.insertData(constants.TOKEN_TRANSACTION_TABLE_NAME, constants.TOKEN_TRANSACTION_DATA_SEQUENCE, tokenTransactionData);
				transactionPromiseList.push(transactionResponse);

				//Format token transactions
				var txnArray = oThis.getAddressTokenTransactionData( tokenTransactionData );
				txnArray.forEach((addrTxn)=>{
					addressTransactionData.push(addrTxn);
				});
			}

			logger.log(addressTransactionData);

			Promise.all(transactionPromiseList)
				.then(function(res){
				result.push(res);

				oThis.insertAddressTokenTransaction( addressTransactionData )
					.then(function(res){
						result.push(res);
						resolve(result);	
					});
			});
		});
	},

	insertAddressTokenTransaction: function( addressTokenTransactionData ){
		return this.dbObject.insertData(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, constants.ADDRESS_TOKEN_TRANSACTION_DATA_SEQUENCE, addressTokenTransactionData);
	},

	getAddressTransactionData: function( transactionData ) {
		var addressTxnArray = [];

		var txnMap = constants['TRANSACTION_INDEX_MAP'];

		var addressTxnFirst = [];
		var addressTxnSecond = [];

		addressTxnFirst.push(transactionData[txnMap['t_from']]);
		addressTxnSecond.push(transactionData[txnMap['t_to']]);

		addressTxnFirst.push(transactionData[txnMap['t_to']]);
		addressTxnSecond.push(transactionData[txnMap['t_from']]);

		addressTxnFirst.push(transactionData[txnMap['tokens']]);
		addressTxnSecond.push(transactionData[txnMap['tokens']]);

		addressTxnFirst.push(transactionData[txnMap['hash']]);
		addressTxnSecond.push(transactionData[txnMap['hash']]);

		var fees = transactionData[txnMap['gas_price']] * transactionData[txnMap['gas_used']];
		addressTxnFirst.push(fees);
		addressTxnSecond.push(fees);

		addressTxnFirst.push(0);
		addressTxnSecond.push(1);

		addressTxnFirst.push(transactionData[txnMap['timestamp']]);
		addressTxnSecond.push(transactionData[txnMap['timestamp']]);

		//Push address transactions
		addressTxnArray.push(addressTxnFirst);
		if (transactionData[txnMap['t_to']] && transactionData[txnMap['t_to']] != transactionData[txnMap['t_from']]) {
			addressTxnArray.push(addressTxnSecond);
		}

		return addressTxnArray;
	},

	getAddressTokenTransactionData: function( transactionData ) {
		var addressTxnArray = [];

		var txnMap = constants['TOKEN_TRANSACTION_INDEX_MAP'];

		var addressTxnFirst = [];
		var addressTxnSecond = [];

		addressTxnFirst.push(transactionData[txnMap['t_from']]);
		addressTxnSecond.push(transactionData[txnMap['t_to']]);

		addressTxnFirst.push(transactionData[txnMap['t_to']]);
		addressTxnSecond.push(transactionData[txnMap['t_from']]);

		addressTxnFirst.push(transactionData[txnMap['tokens']]);
		addressTxnSecond.push(transactionData[txnMap['tokens']]);

		addressTxnFirst.push(transactionData[txnMap['contract_address']]);
		addressTxnSecond.push(transactionData[txnMap['contract_address']]);

		addressTxnFirst.push(transactionData[txnMap['hash']]);
		addressTxnSecond.push(transactionData[txnMap['hash']]);

		addressTxnFirst.push(0);
		addressTxnSecond.push(1);

		addressTxnFirst.push(transactionData[txnMap['timestamp']]);
		addressTxnSecond.push(transactionData[txnMap['timestamp']]);

		//Push address transactions
		addressTxnArray.push(addressTxnFirst);
		addressTxnArray.push(addressTxnSecond);

		return addressTxnArray;
	},

	deleteBlock: function(blockNumber) {
		if( blockNumber ) {
			return this.dbObject.deleteForBlockNumber(constants.BLOCK_TABLE_NAME, 'number', blockNumber);
		}
		return null;

	},

	deleteAddressTokenTransactions: function(txnHashArray) {
		if (txnHashArray) {
			return this.dbObject.deleteForTransactions(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME,'transaction_hash', txnHashArray);
		}
		return null;
	},

	deleteTokenTransactions: function(txnHashArray) {
		if (txnHashArray) {
			return this.dbObject.deleteForTransactions(constants.ADDRESS_TRANSACTION_TABLE_NAME, 'transaction_hash', txnHashArray);
		}
		return null;
	},

	deleteAddressTransactions: function(txnHashArray) {
		if (txnHashArray) {
			return this.dbObject.deleteForTransactions(constants.TOKEN_TRANSACTION_TABLE_NAME, 'hash', txnHashArray);
		}
		return null;
	},

	deleteTransactions: function(txnHashArray) {
		if (txnHashArray) {
			return this.dbObject.deleteForTransactions(constants.TRANSACTION_TABLE_NAME, 'hash', txnHashArray);
		}
		return null;
	},

	updateVerifiedFlag: function(blockNumber) {
		if (undefined != blockNumber) {
			return this.dbObject.updateAttribute(constants.BLOCK_TABLE_NAME, 'verified', true, 'number', blockNumber);
		}
		return null;

	}
};



//To create Singleton 
const dbHelperHandler = (function () {

    var dbHelpers = {};
 
    function createInstance( dbconfig ) {
    	var dbObject;
    	if (dbconfig.driver == "mysql") {
    		dbObject = new MySQL(dbconfig);
    	} else {
    		throw "No supported db driver found in interact.js";
    	}
        var object = new DbHelper(dbObject);
        return object;
    }

    return {
        getInstance: function ( dbconfig ) {
            const id = dbconfig.chainId;
            if (!dbHelpers[id]) {
                const instance = createInstance( dbconfig );
                dbHelpers[id] = instance
            }
            return dbHelpers[id];
        }
    };

})();

module.exports = dbHelperHandler;