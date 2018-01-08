"use strict";

/*
 * DB interact: Interface File to interact with the DB.
 * Author: Sachin
 */

const mysql = require('./mysql.js');
const constants = require('../../config/core_constants.js');
const logger = require('../CustomConsoleLogger');
const dbhelper = {

	insertBlock: function( blockData ) {
		mysql.getInstance().insertData(constants.BLOCK_TABLE_NAME, constants.BLOCKS_DATA_SEQUENCE, blockData)
			.then(function(res) {console.log(res);});		
	},

	insertTransaction: function( transactionData ) {
		mysql.getInstance().insertData(constants.TRANSACTION_TABLE_NAME, constants.TRANSACTION_DATA_SEQUENCE, transactionData)
			.then(function(res,data) {console.log(data);});
		var addressTransactionData = this.getAddressTransactionData( transactionData );
		logger.log(addressTransactionData);

		this.insertAddressTransaction(addressTransactionData);
	},

	insertAddressTransaction: function( addressTransactionData) {
		mysql.getInstance().insertData(constants.ADDRESS_TRANSACTION_TABLE_NAME, constants.ADDRESS_TRANSACTION_DATA_SEQUENCE, addressTransactionData)
			.then(function(res,data) {console.log(data);});	
	},

	insertTokenTransaction: function( tokenTransactionData ) {
		mysql.getInstance().insertData(constants.TOKEN_TRANSACTION_TABLE_NAME, constants.TOKEN_TRANSACTION_DATA_SEQUENCE, tokenTransactionData)
			.then(function(res,data) {console.log(data);});
		var addressTransactionData = this.getAddressTokenTransactionData( tokenTransactionData );
		logger.log(addressTransactionData);

		this.insertAddressTokenTransaction( addressTransactionData );

	},
	insertAddressTokenTransaction: function( addressTokenTransactionData ){
		mysql.getInstance().insertData(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, constants.ADDRESS_TOKEN_TRANSACTION_DATA_SEQUENCE, addressTokenTransactionData)
			.then(function(res,data) {console.log(data);});	
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
		addressTxnArray.push(addressTxnSecond);

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
module.exports = dbhelper;