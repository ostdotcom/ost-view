"use strict"


/**
 * @module lib/webInterface/
 */


//All module required.
const reqPrefix           = "../../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
    , dbInteract = require(reqPrefix + '/helpers/db/interact')
    , rpcInteract = require(reqPrefix + "lib/web3/interact/rpc_interact")
    , constants = require(reqPrefix + '/config/core_constants')        

;

/**
 * @constructor
 * 
 * @param  {String} webRpcUrl - a webRpcUrl that identifies which RPC instance has to create.
 * @param  {Object} chainDBConfig - a hash which contains information to setup database connection and database name.
 */
var transactions = module.exports = function(webRpcUrl, chainDBConfig){
	this._utilityInteractInstance = new rpcInteract(webRpcUrl);
	this._dbInstance = dbInteract.getInstance(chainDBConfig);
}

transactions.prototype = {

	/** 
  	*Gives list of recent transactions in batches.
  	*
	* @param {Integer} page - Page number for getting data in batch. 
  	*
  	*@return {Promise} List of recent transactions.
  	*/
	getRecentTransactions : function(page) {
		const oThis = this;
	    return new Promise(function(resolve, reject){
	    	
	    	if (page == undefined || isNaN(page)) {
				reject('invalid input');
				return;

			}

	    	if (page == undefined || !page || page < 0) {
				page = constants.DEFAULT_PAGE_NUMBER;
			}
			
			oThis._dbInstance.getRecentTransactions(page,constants.TRANSACTION_HASH_LENGTH)
				.then(function(response){
					resolve(response);
				})
				.catch(function(reason){
					reject(reason);
				});
		});
	}


	/** 
  	*Gives list of pending transactions available on web RPC.
  	*
  	*
  	*@return {Promise} List of pending transactions.
  	*/
	,getPendingTransactions : function(){
		const oThis = this;

		return new Promise(function(resolve, reject){

			oThis._utilityInteractInstance.getPendingTransactions()
				.then(function(response){
					resolve(response);
				})
				.catch(function(reason){
					reject(reason);
				});

		});
	}
}
