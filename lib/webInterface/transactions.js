"use strict"

//All module required.
const reqPrefix           = "../../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
    , dbInteract = require(reqPrefix + '/helpers/db/interact')
    , rpcInteract = require(reqPrefix + "lib/web3/interact/rpc_interact")
    , constants = require(reqPrefix + '/config/core_constants')        

;

var transactions = module.exports = function(webRPC, chainDBConfig){
	this._utilityInteractInstance = new rpcInteract(webRPC);
	this._dbInstance = dbInteract.getInstance(chainDBConfig);
}

transactions.prototype = {

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
