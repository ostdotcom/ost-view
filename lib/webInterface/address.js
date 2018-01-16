"use strict"

//All modeules required.
const reqPrefix           = "../.."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
   	, rpcInteract = require(reqPrefix + "/lib/web3/interact/rpc_interact")
   	, dbInteract = require(reqPrefix + '/helpers/db/interact')
   	, coreConstants = require(reqPrefix + '/config/core_constants');
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
	*gives data for given address
	*
	*@param {string} hash - hash of address to be fetched
	*
	*@return{Promise}
  	*/
	getAddressData : function(hash){
		var oThis = this;
		return new Promise(function(resolve, reject){
			if (hash == undefined || hash.length != accountHashLenght) {

				reject (responseHelper.error('r_wi_1', "Something Went Wrong"));
				return;

			}

			oThis.getAddressBalance(hash)
				.then(function(response){
					resolve (response);
				})
				.catch(function(reason){
					reject (reason);

				})
		});

	},
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
					reject (responseHelper.error('r_wi_1', "Something Went Wrong"));
									return;
			}

			if (page == undefined || !page || isNaN(page) || page < 0) {
				page = 1;
			}
			oThis._dbInstance.getAddressTransactions(hash,page,addressTransactionsPageSize)
				.then(function(response){
					resolve(responseHelper.successWithData(response));
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
					reject (responseHelper.error('r_wi_1', "Something Went Wrong"));
									return;
			}

			if (contractAddress == undefined || contractAddress.length != accountHashLenght ) {
					reject (responseHelper.error('r_wi_1', "Something Went Wrong"));
									return;
			}

			if (page == undefined || !page || isNaN(page) || page < 1) {
				page = 1;
			}
			oThis._dbInstance.getAddressLedgerOfContract(address, contractAddress, page, addressTransactionsPageSize)
				.then(function(response){
					resolve(responseHelper.successWithData(response));
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
					reject (responseHelper.error('r_wi_1', "Something Went Wrong"));
									return;
			}

			if (page == undefined || !page || isNaN(page) || page < 1) {
				page = 1;
			}
			oThis._dbInstance.getAddressTokenTransactions(address, page, addressTransactionsPageSize)
				.then(function(response){
					resolve(responseHelper.successWithData(response));
				})
				.catch(function(reason){
					reject(reason);
				});

		});
	}
}
