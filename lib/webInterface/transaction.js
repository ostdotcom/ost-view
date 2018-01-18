"use strict"

const reqPrefix           = "../../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
    , rpcInteract = require(reqPrefix + "lib/web3/interact/rpc_interact")
    , dbInteract = require(reqPrefix + 'helpers/db/interact')
    , logger = require (reqPrefix + 'helpers/CustomConsoleLogger') 
    , constants = require(reqPrefix + '/config/core_constants')        
;


var transaction = module.exports = function(webRPC, chainDBConfig){
	this._utilityInteractInstance = new rpcInteract(webRPC);
	this._dbInstance = dbInteract.getInstance(chainDBConfig);

	this._currentInstance = this._dbInstance;
}



transaction.prototype = {

  /** 
  	* gives transaction data for given transaction hash.
  	*
  	*@param {string} hash - transaction hash 
  	*
  	*@return{Promise}
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
