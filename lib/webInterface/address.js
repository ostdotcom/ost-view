"use strict"

/** 
 * This is a interface file which would be used for executing all data fetching  methods from database or Eth.
 * 
 * @module lib/webInterface/
 */

//All modeules required.
const reqPrefix           = "../.."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
   	, rpcInteract = require(reqPrefix + "/lib/web3/interact/rpc_interact")
   	, dbInteract = require(reqPrefix + '/helpers/db/interact')
   	, constants = require(reqPrefix + '/config/core_constants')
;


/**
 * @constructor
 * 
 * @param  {String} webRpcUrl - a webRpcUrl that identifies which RPC instance has to create.
 * @param  {Object} chainDBConfig - a hash which contains information to setup database connection and database name.
 */
var address = module.exports = function(webRpcUrl, chainDBConfig){
	this._utilityInteractInstance = new rpcInteract(webRpcUrl);
	this._dbInstance = dbInteract.getInstance(chainDBConfig);
}

address.prototype = {


	/**
	 * This method servers available balance of address on RPC value chain.
	 * 
	 * @param {String} hash - A hash is of 42 bit String.
	 * 
	 * @return {Promise}  Available balance of address.
	 */
	getAddressBalance : function (hash) {
		const oThis = this;
		return new Promise(function(resolve, reject){
			if (hash == undefined || hash.length != constants.ACCOUNT_HASH_LENGTH) {

				reject('invalid input');
				return;
			}

			oThis._utilityInteractInstance.getBalance(hash)
				.then(function(response){
					resolve (response);
				})
				.catch(function(reason){
					reject (reason);  
				});
		});	
	}

	/**
	 * Ask the database for transations of particular address in batches.
	 * 
	 * @param {String} hash - A hash is of 42 bit String.
	 * @param {Integer} page - Page number for getting data in batch. 

	 * @return {Promise} A transations of address which are available in database.
	 */
	,getAddressTransactions : function (hash, page){

		const oThis = this;
		return new Promise(function(resolve, reject){
			if (hash == undefined || hash.length != constants.ACCOUNT_HASH_LENGTH ) {
					reject ("invalid input");
									return;
			}

			if (page == undefined || !page || isNaN(page) || page < 0) {
				page = constants.DEFAULT_PAGE_NUMBER;
			}
			oThis._dbInstance.getAddressTransactions(hash,page,constants.DEFAULT_PAGE_SIZE)
				.then(function(response){
					resolve(response);
				})
				.catch(function(reason){
					reject(reason);
				});
		});
	}

	/**
	 * Fetches transactions from database done from particular user in given contract in batches.
	 *  
	 * @param  {Sting} address - An address is of 42 bit String.
	 * @param  {Sting} contractAddress - An contractAddress is of 42 bit String.
	 * @param  {interger} page - Page locating a index from where list has to be fetched.
	 * 
	 * @return {promise}  List of transactions available in database for particular batch.
	 */
	,getAddressLedgerInContract : function(address, contractAddress, page){
		const oThis = this;
		return new Promise(function(resolve, reject){
			if (address == undefined || address.length != constants.ACCOUNT_HASH_LENGTH ) {
					reject ("invalid address");
									return;
			}

			if (contractAddress == undefined || contractAddress.length != constants.ACCOUNT_HASH_LENGTH ) {
					reject ("invalid contract address");
							return;
			}

			if (page == undefined || !page || isNaN(page) || page < 1) {
				page = constants.DEFAULT_PAGE_NUMBER;
			}
			oThis._dbInstance.getAddressLedgerOfContract(address, contractAddress, page, constants.DEFAULT_PAGE_SIZE)
				.then(function(response){
					resolve(response);
				})
				.catch(function(reason){
					reject(reason);
				});
		});
	}

	/**
	 * Fetches token transactions from database done from particular address in batches.
	 *  
	 * @param  {Sting} address - An address is of 42 bit String.
	 * @param  {interger} page - page locating a index from where list has to be fetched.
	 * 
	 * @return {promise}  list of token transactions available in database for particular batch.
	 */
	,getAddressTokenTransactions : function(address, page){
		const oThis = this;
		return new Promise(function(resolve, reject){
			if (address == undefined || address.length != constants.ACCOUNT_HASH_LENGTH ) {
					reject ("invalid input");
					return;
			}

			if (page == undefined || !page || isNaN(page) || page < 1) {
				page = constants.DEFAULT_PAGE_NUMBER;
			}
			oThis._dbInstance.getAddressTokenTransactions(address, page, constants.DEFAULT_PAGE_SIZE)
				.then(function(response){
					resolve(response);
				})
				.catch(function(reason){
					reject(reason);
				});

		});
	}
}
