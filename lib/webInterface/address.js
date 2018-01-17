"use strict"

//All modeules required.
const reqPrefix           = "../.."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
   	, rpcInteract = require(reqPrefix + "/lib/web3/interact/rpc_interact")
   	, dbInteract = require(reqPrefix + '/helpers/db/interact')
;

/** @constant {Number} */
const accountHashLenght = 42;

/** @constant {Number} */
const transactionHashLength = 66;

const addressTransactionsPageSize = 10;

var address = module.exports = function(webRPC, chainDBConfig){
	this._utilityInteractInstance = new rpcInteract(webRPC);
	this._dbInstance = dbInteract.getInstance(chainDBConfig);
}

address.prototype = {
	
  /** 
	*gives ST balance for given address
	*
	*@param {string} hash - hash of address for which balance is to be fetched
	*
	*@return{Promise}
  	*/
	getAddressBalance : function (hash) {
		const oThis = this;
		return new Promise(function(resolve, reject){
			if (hash == undefined || hash.length != accountHashLenght) {

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
	*gives list of transactions for given address
	*
	*@param {string} hash - hash of address for which transactions needed
	*@param {Number} page - page number for pagination 
	*
	*@return {[Promise]}
  	*/

	,getAddressTransactions : function (hash, page){

		const oThis = this;
		return new Promise(function(resolve, reject){
			if (hash == undefined || hash.length != accountHashLenght ) {
					reject ("invalid input");
									return;
			}

			if (page == undefined || !page || isNaN(page) || page < 0) {
				page = 1;
			}
			oThis._dbInstance.getAddressTransactions(hash,page,addressTransactionsPageSize)
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
			if (address == undefined || address.length != accountHashLenght ) {
					reject ("invalid address");
									return;
			}

			if (contractAddress == undefined || contractAddress.length != accountHashLenght ) {
					reject ("invalid contract address");
									return;
			}

			if (page == undefined || !page || isNaN(page) || page < 1) {
				page = 1;
			}
			oThis._dbInstance.getAddressLedgerOfContract(address, contractAddress, page, addressTransactionsPageSize)
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
			if (address == undefined || address.length != accountHashLenght ) {
					reject ("invalid input");
					return;
			}

			if (page == undefined || !page || isNaN(page) || page < 1) {
				page = 1;
			}
			oThis._dbInstance.getAddressTokenTransactions(address, page, addressTransactionsPageSize)
				.then(function(response){
					resolve(response);
				})
				.catch(function(reason){
					reject(reason);
				});

		});
	}
}
