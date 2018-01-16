"use strict";

/*
 * DB interact: Interface File to interact with the DB.
 * Author: Sachin
 */

const MySQL = require('./mysql.js');
const constants = require('../../config/core_constants.js');
const logger = require('../CustomConsoleLogger');

var mysql;

const DbHelper = module.exports = function(dbconfig){
	this.mysql = new MySQL(dbconfig);
} 


const defaultPageSize = 10;
const defaultPageNumber = 1;

DbHelper.prototype = {


	getTransaction: function (transactionHash){

		return this.mysql.selectTransaction(constants.TRANSACTION_TABLE_NAME, transactionHash);

	},

	getRecentBlocks: function (pageNumber, pageSize){
		if(undefined == pageNumber) {
			pageNumber = defaultPageNumber;
		}
		if(undefined == pageSize) {
			pageSize = defaultPageSize;
		}

		return this.mysql.selectRecentBlocks(constants.BLOCK_TABLE_NAME, pageNumber, pageSize);
	},

	getBlock : function (blockNumber){
		if(undefined == blockNumber) {
			return;
		}

		return this.mysql.selectBlock(constants.BLOCK_TABLE_NAME, blockNumber);
	},

	getAddressLedgerOfContract: function (address, contractAddress, pageNumber, pageSize){
		if(undefined == pageNumber) {
			pageNumber = defaultPageNumber;
		}
		if(undefined == pageSize) {
			pageSize = defaultPageSize;
		}

		return this.mysql.selectAddressLedgerOfContract(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, address, contractAddress, pageNumber, pageSize);
	},

	getContractLedger: function (contractAddress, pageNumber, pageSize){
		if(undefined == pageNumber) {
			pageNumber = 1;
		}
		if(undefined == pageSize) {
			pageSize = 10;
		}

		return this.mysql.selectContractLedger(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, contractAddress, pageNumber, pageSize);
	},

	getHigestInsertedBlock: function ( blockNumber ) {
		return this.mysql.selectHigestInsertedBlock(constants.BLOCK_TABLE_NAME);
	},

	getRecentTransactions: function ( pageNumber, pageSize) {
		if(undefined == pageNumber) {
			pageNumber = 1;
		}
		if(undefined == pageSize) {
			pageSize = 10;
		}
		return this.mysql.selectRecentTransactions(constants.TRANSACTION_TABLE_NAME, pageNumber, pageSize);
	},

	getBlockTransactions: function ( blockNumber, pageNumber, pageSize) {
		if(undefined == pageNumber) {
			pageNumber = 1;
		}
		if(undefined == pageSize) {
			pageSize = 10;
		}
		return this.mysql.selectBlockTransactions(constants.TRANSACTION_TABLE_NAME, blockNumber, pageNumber, pageSize);
	},

	getAddressTransactions: function( address, pageNumber, pageSize ) {
		if(undefined == pageNumber) {
			pageNumber = 1;
		}
		if(undefined == pageSize) {
			pageSize = 10;
		}
		return this.mysql.selectAddressTransactions(constants.ADDRESS_TRANSACTION_TABLE_NAME, address, pageNumber, pageSize);				
	},

	getAddressTokenTransactions: function( address, pageNumber, pageSize ) {
		if(undefined == pageNumber) {
			pageNumber = 1;
		}
		if(undefined == pageSize) {
			pageSize = 10;
		}
		return this.mysql.selectAddressTransactions(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, address, pageNumber, pageSize);				
	},

	insertBlock: function( blockDataArray ) {
		return this.mysql.insertData(constants.BLOCK_TABLE_NAME, constants.BLOCKS_DATA_SEQUENCE, blockDataArray);				
	},

	insertTransaction: function( transactionDataArray ) {
		var oThis = this;
		return new Promise(function(resolve, reject){
			var result = [];
			var transactionPromiseList = [];
			var addressTransactionData = [];
			for (var ind in transactionDataArray) {
				var transactionData = transactionDataArray[ind];
				var transactionResponse =  oThis.mysql.insertData(constants.TRANSACTION_TABLE_NAME, constants.TRANSACTION_DATA_SEQUENCE, transactionData);
				transactionPromiseList.push(transactionResponse);

				//Format transactions
				addressTransactionData = oThis.getAddressTransactionData( transactionData );
				logger.log(addressTransactionData);
			}


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
		return this.mysql.insertData(constants.ADDRESS_TRANSACTION_TABLE_NAME, constants.ADDRESS_TRANSACTION_DATA_SEQUENCE, addressTransactionData);
	},

	insertTokenTransaction: function( tokenTransactionDataArray ) {
		var oThis = this;
		return new Promise(function(resolve, reject){
			var result = [];
			var transactionPromiseList = [];
			var addressTransactionData = [];
			for (var ind in tokenTransactionDataArray) {
				var tokenTransactionData = tokenTransactionDataArray[ind];
				var transactionResponse = oThis.mysql.insertData(constants.TOKEN_TRANSACTION_TABLE_NAME, constants.TOKEN_TRANSACTION_DATA_SEQUENCE, tokenTransactionData);
				transactionPromiseList.push(transactionResponse);

				//Format token transactions
				addressTransactionData = oThis.getAddressTokenTransactionData( tokenTransactionData );
				logger.log(addressTransactionData);
			}


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
		return this.mysql.insertData(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, constants.ADDRESS_TOKEN_TRANSACTION_DATA_SEQUENCE, addressTokenTransactionData);
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
	}

};



//To create Singleton 
const dbHelperHandler = (function () {
    var dbHelpers = {};
 
    function createInstance( dbconfig ) {
        var object = new DbHelper(dbconfig);
        return object;
    }

    return {
        getInstance: function ( dbconfig ) {
            const db = dbconfig.database
            if (!dbHelpers[db]) {
                const instance = createInstance( dbconfig );
                dbHelpers[db] = instance
            }
            return dbHelpers[db];
        }
    };
})();

module.exports = dbHelperHandler;


//To test

//dbhelper.insertBlock([1,'test','pare','pare','pare','pare',3,4,3,4]);
//dbhelper.insertTransaction(['tester', 12, 323, 'parde', 'parxe', 'pare', 3223, 4, 3, 4, null, 3]);
//dbhelper.getAddressTokenTransactions('0x6c319a125bf5507937db6f8faae715bddc668f5b', 2).then(logger.log);
//dbhelper.getBlockTransactions(13,10);