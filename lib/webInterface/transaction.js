"use strict"

/**
 * @module lib/webInterface/
 */

const reqPrefix           = "../../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
    , rpcInteract = require(reqPrefix + "lib/web3/interact/rpc_interact")
    , dbInteract = require(reqPrefix + 'helpers/db/interact')
    , logger = require (reqPrefix + 'helpers/CustomConsoleLogger') 
    , constants = require(reqPrefix + '/config/core_constants')        
;

/**
 * @constructor
 * 
 * @param  {String} webRpcUrl - a webRpcUrl that identifies which RPC instance has to create.
 * @param  {Object} chainDBConfig - a hash which contains information to setup database connection and database name.
 */
var transaction = module.exports = function(webRpcUrl, chainDBConfig){
	this._utilityInteractInstance = new rpcInteract(webRpcUrl);
	this._dbInstance = dbInteract.getInstance(chainDBConfig);

	this._currentInstance = this._dbInstance;
}



transaction.prototype = {

  /** 
  	*Gives list of transactions for given transaction hash.
  	*
  	*@param {String} hash - a hash is a string of length 42. 
  	*
  	*@return {Promise} List of transactions
  	*/
	getTransaction : function(hash){

		const oThis = this;
	    return new Promise(function(resolve, reject){

			if (!hash || hash == undefined || hash.length != constants.TRANSACTION_HASH_LENGTH) {
				reject('invalid input');
				return;
			}
			
			oThis._currentInstance.getTransaction(hash)
				.then(function(response){
					resolve(response);
				})
				.catch(function(reason){
					reject(reason);
				});
		})	
	}

	/**
	 * Ask the database for list transations of particular address in batches.
	 * 
	 * @param {String} hash - A hash is of 42 bit String.
	 * @param {Integer} page - Page number for getting data in batch. 

	 * @return {Promise} A transations of address which are available in database.
	 */
	,getAddressTransactions : function(hash, page){
		const oThis = this;

		return new Promise(function(resolve, reject){

			if (!hash || hash == undefined || hash.length != constants.ACCOUNT_HASH_LENGTH) {
				reject('invalid input');

				return;
			}

			 if (page == undefined || !page || isNaN(page) || page < 0) {
			    page = constants.DEFAULT_PAGE_NUMBER;
			 }


			oThis._currentInstance.getAddressTransactions(hash, page, constants.DEFAULT_PAGE_SIZE)
				.then(function(response){
					resolve(response);
				})

				.catch(function(reason){
					reject(reason)
				});
		})
	} 		
	
}
