"use strict";

/*
 * DB interact: Interface File to interact with the DB.
 * @module helpers/db/
 */

const rootPrefix           = "../.."
    , MySQL 			  = require( rootPrefix + '/helpers/db/mysql')
    , constants           = require( rootPrefix + '/config/core_constants')
    , logger              = require( rootPrefix + '/helpers/custom_console_logger');

const DEFAULT_PAGE_NUMBER = constants.DEFAULT_PAGE_NUMBER;
const DEFAULT_PAGE_SIZE   = constants.DEFAULT_PAGE_SIZE;

/**
 * @constructor
 * Constructor to create DbHelper object
 * @param {Object} dbObj DB Object
 */
const DbHelper = function(dbObj){
	this.dbObject = dbObj;
} 

DbHelper.prototype = {

	/**
	 * To Delegate getTransaction call to the DB
	 * @param  {String}	transactionHash Transaction hash
	 * @return {Promise}
	 */
	getTransaction: function (transactionHash){

		return this.dbObject.selectTransaction(transactionHash);
	},

	/**
	 * To Delegate getRecentBlocks call to the DB
	 * @param  {Integer} pageNumber of the recentBlock List
	 * @param  {Integer} pageSize of the recentBlock List
	 * @return {Promise}
	 */
	getRecentBlocks: function (pageNumber, pageSize){
		if(undefined == pageNumber) {
			pageNumber = DEFAULT_PAGE_NUMBER;
		}
		if(undefined == pageSize) {
			pageSize = DEFAULT_PAGE_SIZE;
		}

		return this.dbObject.selectRecentBlocks(pageNumber, pageSize);
	},

	/**
	 * To Delegate getBlock call to the DB
	 * @param  {Integer} blockNumber Number of the block
	 * @return {Promise}
	 */
	getBlock : function (blockNumber){
		
		return this.dbObject.selectBlock(blockNumber);
	},

	/**
	 * To Delegate getAddressLedgerOfContract call to the DB
	 * @param  {String} address Address 
	 * @param  {String} contractAddress Contract Address
	 * @param  {Integer} pageNumber PageNumber of the ledger List
	 * @param  {Integer} pageSize PageSize of the ledger List
	 * @return {Promise}
	 */
	getAddressLedgerOfContract: function (address, contractAddress, pageNumber, pageSize){
		if(undefined == pageNumber) {
			pageNumber = DEFAULT_PAGE_NUMBER;
		}
		if(undefined == pageSize) {
			pageSize = DEFAULT_PAGE_SIZE;
		}

		return this.dbObject.selectAddressLedgerOfContract(address, contractAddress, pageNumber, pageSize);
	},

	/**
	 * To Delegate getContractLedger call to the DB
	 * @param  {String} contractAddress Contract Address
	 * @param  {Integer} pageNumber PageNumber of the ledger List
	 * @param  {Integer} pageSize PageSize of the ledger List
	 * @return {Promise}
	 */
	getContractLedger: function (contractAddress, pageNumber, pageSize){
		if(undefined == pageNumber) {
			pageNumber = DEFAULT_PAGE_NUMBER;
		}
		if(undefined == pageSize) {
			pageSize = DEFAULT_PAGE_SIZE;
		}

		return this.dbObject.selectContractLedger(contractAddress, pageNumber, pageSize);
	},

	/**
	 * To Delegate getHigestInsertedBlock call to the DB
	 * @param  {Integer} blockNumber Number of the block
	 * @return {Promise}
	 */
	getHigestInsertedBlock: function ( blockNumber ) {
		return this.dbObject.selectHigestInsertedBlock();
	},

	/**
	 * To Delegate getRecentTransactions call to the DB
	 * @param  {Integer} pageNumber PageNumber of the recentTransactoins List
	 * @param  {Integer} pageSize PageSize of the recentTransactoins List
	 * @return {Promise}
	 */
	getRecentTransactions: function ( pageNumber, pageSize) {
		if(undefined == pageNumber) {
			pageNumber = DEFAULT_PAGE_NUMBER;
		}
		if(undefined == pageSize) {
			pageSize = DEFAULT_PAGE_SIZE;
		}

		return this.dbObject.selectRecentTransactions(pageNumber, pageSize);
	},

	/**
	 * To Delegate getBlockTransactions call to the DB
	 * @param  {Integer} blockNumber Number of the block
	 * @param  {Integer} pageNumber PageNumber of the transaction List
	 * @param  {Integer} pageSize PageSize of the transaction List
	 * @return {Promise}
	 */
	getBlockTransactions: function ( blockNumber, pageNumber, pageSize) {
		if(undefined == pageNumber) {
			pageNumber = DEFAULT_PAGE_NUMBER;
		}
		if(undefined == pageSize) {
			pageSize = DEFAULT_PAGE_SIZE;
		}

		return this.dbObject.selectBlockTransactions(blockNumber, pageNumber, pageSize);
	},

	/**
	 * To Delegate getAddressTransactions call to the DB
	 * @param  {String} address Address 
	 * @param  {Integer} pageNumber PageNumber of the ledger List
	 * @param  {Integer} pageSize PageSize of the ledger List
	 * @return {Promise}
	 */
	getAddressTransactions: function( address, pageNumber, pageSize ) {
		if(undefined == pageNumber) {
			pageNumber = DEFAULT_PAGE_NUMBER;
		}
		if(undefined == pageSize) {
			pageSize = DEFAULT_PAGE_SIZE;
		}

		return this.dbObject.selectAddressTransactions(constants.ADDRESS_TRANSACTION_TABLE_NAME, address, pageNumber, pageSize);				
	},

	/**
	 * To Delegate getAddressTokenTransactions call to the DB
	 * @param  {String} address Address 
	 * @param  {Integer} pageNumber PageNumber of the token ledger List
	 * @param  {Integer} pageSize PageSize of the token ledger List
	 * @return {Promise}
	 */
	getAddressTokenTransactions: function( address, pageNumber, pageSize ) {
		if(undefined == pageNumber) {
			pageNumber = DEFAULT_PAGE_NUMBER;
		}
		if(undefined == pageSize) {
			pageSize = DEFAULT_PAGE_SIZE;
		}

		return this.dbObject.selectAddressTransactions(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, address, pageNumber, pageSize);				
	},

	/**
	 * To Delegate insertBlock call to the DB
	 * @param  {Array}	blockDataArray Array of Block Data Content Array
	 * @return {Promise}
	 */
	insertBlock: function( blockDataArray ) {
		return this.dbObject.insertData(constants.BLOCK_TABLE_NAME, constants.BLOCKS_DATA_SEQUENCE, blockDataArray);				
	},

	/**
	 * To Delegate insertTransaction call to the DB
	 * It also handles insertAddressTransaction call to the DB
	 * @param  {Array}	transactionDataArray Array of Transactions Data Content Array
	 * @return {Promise}
	 */
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
				txnArray.forEach(function (addrTxn){
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

	/**
	 * To Delegate insertAddressTransaction call to the DB
	 * @param  {Array} addressTransactionData Array of Address Transaction Data
	 * @return {Promise}
	 */
	insertAddressTransaction: function( addressTransactionData) {
		return this.dbObject.insertData(constants.ADDRESS_TRANSACTION_TABLE_NAME, constants.ADDRESS_TRANSACTION_DATA_SEQUENCE, addressTransactionData);
	},

	/**
	 * To Delegate insertTokenTransaction call to the DB
	 * It also handles insertAddressTokenTransaction call to the DB
	 * @param  {Array}	tokenTransactionDataArray Array of TokenTransactions Data Content Array
	 * @return {Promise}
	 */
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
				txnArray.forEach(function (addrTxn){
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

	/**
	 * To Delegate insertAddressTokenTransaction call to the DB
	 * @param  {Array} addressTokenTransactionData Array of Token Address Transaction Data
	 * @return {Promise}
	 */
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

	/**
	 * To Delegate call deleting all the data of the block .
	 * @param  {Integer} blockNumber Number of the block
	 * @return {Promise}
	 */
	deleteBlock: function(blockNumber) {
		if( blockNumber ) {
			return this.dbObject.deleteForBlockNumber(blockNumber);
		}
		return Promise.reject(new Error('blockNumber is undefined'));

	},

	/**
	 * To Delegate deleteAddressTokenTransactions call to DB.
	 * @param  {Array} txnHashArray Transaction hash array to be deleted
	 * @return {Promise}
	 */
	deleteAddressTokenTransactions: function(txnHashArray) {
		if (txnHashArray) {
			return this.dbObject.deleteForTransactions(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME,'transaction_hash', txnHashArray);
		}
		return Promise.reject(new Error('txnHashArray is undefined'));
	},

	/**
	 * To Delegate deleteTokenTransactions call to DB.
	 * @param  {Array} txnHashArray Transaction hash array to be deleted
	 * @return {Promise}
	 */
	deleteTokenTransactions: function(txnHashArray) {
		if (txnHashArray) {
			return this.dbObject.deleteForTransactions(constants.ADDRESS_TRANSACTION_TABLE_NAME, 'transaction_hash', txnHashArray);
		}
		return Promise.reject(new Error('txnHashArray is undefined'));
	},

	/**
	 * To Delegate deleteAddressTransactions call to DB.
	 * @param  {Array} txnHashArray Transaction hash array to be deleted
	 * @return {Promise}
	 */
	deleteAddressTransactions: function(txnHashArray) {
		if (txnHashArray) {
			return this.dbObject.deleteForTransactions(constants.TOKEN_TRANSACTION_TABLE_NAME, 'hash', txnHashArray);
		}
		return Promise.reject(new Error('txnHashArray is undefined'));
	},

	/**
	 * To Delegate deleteTransactions call to DB.
	 * @param  {Array} txnHashArray Transaction hash array to be deleted
	 * @return {Promise}
	 */
	deleteTransactions: function(txnHashArray) {
		if (txnHashArray) {
			return this.dbObject.deleteForTransactions(constants.TRANSACTION_TABLE_NAME, 'hash', txnHashArray);
		}
		return Promise.reject(new Error('txnHashArray is undefined'));
	},

	/**
	 * To Delegate call to update verify flag of the block data in DB.
	 * @param  {Integer} blockNumber Number of the block
	 * @return {Promise}
	 */
	updateVerifiedFlag: function(blockNumber) {
		if (undefined != blockNumber) {
			return this.dbObject.updateAttribute(constants.BLOCK_TABLE_NAME, 'verified', true, 'number', blockNumber);
		}
		return Promise.reject(new Error('blockNumber is undefined'));

	}
};



/**
 * To create Singleton instance of DbHelper of repective chainIDs.
 */
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