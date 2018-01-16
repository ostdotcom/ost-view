"use strict"

const reqPrefix           = "../../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
    , utility_interact = require(reqPrefix + "lib/web3/interact/utility_interact")
    , dbInteract = require(reqPrefix + 'helpers/db/interact')
    , logger = require (reqPrefix + 'helpers/CustomConsoleLogger') 
    , coreConstants = require(reqPrefix +'/config/core_constants');

;

const transactionHashLength = 66
const addressHashLength = 42


var transaction = module.exports = function(webRPC, chainDBConfig){
	this._utilityInteractInstance = new utility_interact(webRPC);
	this._dbInstance = dbInteract.getInstance(chainDBConfig);
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

			if (!hash || hash == undefined || hash.length != transactionHashLength) {
				reject('invalid input');
							logger.log("*********** 12 ********",hash);

				return;
			}
			
			oThis._utilityInteractInstance.getTransaction(hash)
				.then(function(response){
					resolve(responseHelper.successWithData(response));
				})
				.catch(function(reason){
					reject(reason)
				});
		})	
	}

	,getAddressTransactions : function(hash){
		const oThis = this;

		return new Promise(function(resolve, reject){

			if (!hash || hash == undefined || hash.length != addressHashLength) {
				reject('invalid input');

				return;
			}
			oThis._dbInstance.getAddressTransactions(hash)
				.then(function(response){
					logger.log("******* 1 *******");
					resolve(response);
				})

				.catch(function(reason){
					logger.log("******* 1 *******");
					logger.log(response);
					reject(reason)
				});
		})
	} 		
	
}
