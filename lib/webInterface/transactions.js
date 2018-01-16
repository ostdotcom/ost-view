"use strict"

//All module required.
const reqPrefix           = "../../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
    , dbInteract = require(reqPrefix + '/helpers/db/interact')
    , utility_interact = require(reqPrefix + "lib/web3/interact/utility_interact")
;

const recentTransactionsPageSize = 10;

var transactions = module.exports = function(webRPC, chainDBConfig){
	this._utilityInteractInstance = new utility_interact(webRPC);
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

	    	if (!page || page < 0) {
				page = 1;
			}
			
			oThis._dbInstance.getRecentTransactions(page,recentTransactionsPageSize)
				.then(function(response){
					resolve(responseHelper.successWithData(response));
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
					resolve(responseHelper.successWithData(response));
				})
				.catch(function(reason){
					reject(reason);
				});

		});
	}
}
