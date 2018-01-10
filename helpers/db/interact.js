"use strict";

/*
 * DB interact: Interface File to interact with the DB.
 * Author: Sachin
 */

const mysql = require('./mysql.js');
const constants = require('../../config/core_constants.js');
const logger = require('../CustomConsoleLogger');
const dbhelper = {

	getAddressTransactions: function( address ) {
		return mysql.getInstance().selectAddressTransactions(constants.ADDRESS_TRANSACTION_TABLE_NAME, address);				
	},

	getAddressTokenTransactions: function( address ) {
		return mysql.getInstance().selectAddressTransactions(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, address);				
	},

	insertBlock: function( blockDataArray ) {
		return mysql.getInstance().insertData(constants.BLOCK_TABLE_NAME, constants.BLOCKS_DATA_SEQUENCE, blockDataArray);				
	},

	insertTransaction: function( transactionDataArray ) {
		var oThis = this;
		return new Promise(function(resolve, reject){
			var result = [];
			var transactionPromiseList = [];
			var addressTransactionData = [];
			for (var ind in transactionDataArray) {
				var transactionData = transactionDataArray[ind];
				var transactionResponse =  mysql.getInstance().insertData(constants.TRANSACTION_TABLE_NAME, constants.TRANSACTION_DATA_SEQUENCE, transactionData);
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
		return mysql.getInstance().insertData(constants.ADDRESS_TRANSACTION_TABLE_NAME, constants.ADDRESS_TRANSACTION_DATA_SEQUENCE, addressTransactionData);
	},

	insertTokenTransaction: function( tokenTransactionDataArray ) {
		var oThis = this;
		return new Promise(function(resolve, reject){
			var result = [];
			var transactionPromiseList = [];
			var addressTransactionData = [];
			for (var ind in tokenTransactionDataArray) {
				var tokenTransactionData = tokenTransactionDataArray[ind];
				var transactionResponse = mysql.getInstance().insertData(constants.TOKEN_TRANSACTION_TABLE_NAME, constants.TOKEN_TRANSACTION_DATA_SEQUENCE, tokenTransactionData);
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
		return mysql.getInstance().insertData(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, constants.ADDRESS_TOKEN_TRANSACTION_DATA_SEQUENCE, addressTokenTransactionData);
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

//To test
// dbhelper.insertBlock([1,'test','pare','pare','pare','pare',3,4,3,4]);
// dbhelper.insertTransaction(['tester', 12, 323, 'parde', 'parxe', 'pare', 3223, 4, 3, 4, null, 3]);
// dbhelper.getAddressTokenTransactions('0xf37c5eF8b20F16CA5F7b4Efe9Ea261aa4Cff63b2').then(logger.log);
// dbhelper.getAddressTransactions('0xf37c5eF8b20F16CA5F7b4Efe9Ea261aa4Cff63b2').then(logger.log);
module.exports = dbhelper;