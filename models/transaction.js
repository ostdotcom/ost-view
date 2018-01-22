"use strict"
/**
 * Model to fetch all transaction related details from database or from chain.
 *
 * @module models/transaction
 */

// load all internal dependencies
const rootPrefix           = ".."
    , rpcInteract = require(rootPrefix + '/lib/web3/interact/rpc_interact')
    , dbInteract = require(rootPrefix + '/helpers/db/interact')
    , constants = require(rootPrefix + '/config/core_constants')
	  , coreConfig = require(rootPrefix + '/config')
;

/**
 * @constructor
 *
 * @param  {Integer} chainId - chain id to connect to respective geth node and database instance
 */
var transaction = module.exports = function(chainId){
  this._utilityInteractInstance = new rpcInteract(coreConfig.getWebRpcUrl(chainId));
  this._dbInstance = dbInteract.getInstance(coreConfig.getChainDbConfig(chainId));
}


transaction.prototype = {

  /** 
  	*Get list of transactions for given transaction address.
  	*
  	*@param {String} address - transaction address.
  	*
  	*@return {Promise} List of transactions
  	*/
	getTransaction : function(address){

		const oThis = this;
	    return new Promise(function(resolve, reject){

			if (!address || address == undefined || address.length != constants.TRANSACTION_HASH_LENGTH) {
				reject('invalid input');
				return;
			}
			
			oThis._dbInstance.getTransaction(address)
				.then(function(response){
					resolve(response);
				})
				.catch(function(reason){
					reject(reason);
				});
		})	
	}

	/**
	 * Get list transactions of a address from database.
	 *
   * @param {String} address - transaction address.
	 * @param {Integer} page - page number.
	 *
	 * @return {Promise<Object>} List of transations for address which are available in database.
	 */
	,getAddressTransactions : function(address, page){
		const oThis = this;

		return new Promise(function(resolve, reject){

			if (!address || address == undefined || address.length != constants.ACCOUNT_HASH_LENGTH) {
				reject('invalid input');

				return;
			}

			 if (page == undefined || !page || isNaN(page) || page < 0) {
			    page = constants.DEFAULT_PAGE_NUMBER;
			 }


			oThis._dbInstance.getAddressTransactions(address, page, constants.DEFAULT_PAGE_SIZE)
				.then(function(response){
					resolve(response);
				})

				.catch(function(reason){
					reject(reason)
				});
		})
	}

	/**
   * Get list of recent transactions in batches.
   *
   * @param {Integer} page - page number.
   *
   * @return {Promise<Object>} List of recent transactions.
   */
  ,getRecentTransactions : function(page) {
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
   *Get list of pending transactions available on utility chain.
   *
   *@return {Promise<Object>} List of pending transactions.
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
