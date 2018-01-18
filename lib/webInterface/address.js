"use strict"

//All modeules required.
const reqPrefix           = "../.."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
   	, rpcInteract = require(reqPrefix + "/lib/web3/interact/rpc_interact")
   	, dbInteract = require(reqPrefix + '/helpers/db/interact')
   	, constants = require(reqPrefix + '/config/core_constants')
;

var address = module.exports = function(webRPC, chainDBConfig){
	this._utilityInteractInstance = new rpcInteract(webRPC);
	this._dbInstance = dbInteract.getInstance(chainDBConfig);
}

address.prototype = {

 
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
