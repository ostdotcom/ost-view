"use strict"

const reqPrefix           = "../../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
    , utility_interact = require(reqPrefix + "lib/web3/interact/utility_interact")

;

const transactionHashLenght = 66

var transaction = {

  /** 
  	* gives transaction data for given transaction hash.
  	*
  	*@param {string} hash - transaction hash 
  	*
  	*@return{Promise}
  	*/
	getTransaction : function(hash){

	    return new Promise(function(resolve, reject){

			if (!hash || hash == undefined || hash.length != transactionHashLenght) {
				reject('invalid input');
				return;
			}

			utility_interact.getTransaction()
				.then(function(response){
					resolve(responseHelper.successWithData(response));
				})
				.catch(function(reason){
					reject(reason)
				});
		})		
	}
}

module.exports = transaction;