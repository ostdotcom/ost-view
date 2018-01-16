"use strict"

//All modeules required.
const reqPrefix           = "../.."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
    , stContractInteract = require(reqPrefix + "/lib/contract_interact/simpleToken")
   	, utility_interact = require(reqPrefix + "/lib/web3/interact/utility_interact")
   	, dbInteract = require(reqPrefix + '/helpers/db/interact')
   	, coreConstants = require(reqPrefix + '/config/core_constants');
;

/** @constant {Number} */
const accountHashLenght = 42;

/** @constant {Number} */
const transactionHashLength = 66;

const addressTransactionsPageSize = 10;

var address = module.exports = function(webRPC, chainDBConfig){
	this._utilityInteractInstance = new utility_interact(webRPC);
	this._dbInstance = new dbInteract(chainDBConfig);
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

			oThis._utilityInteractInstance._getBalance(hash, stContractInteract)
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
				page = 0;
			}
			oThis._dbInstance.getAddressTransactions(hash,page,transactionsPageSize)
				.then(function(response){
					resolve(responseHelper.successWithData(response));
				})
				.catch(function(reason){
					reject(reason);
				});
		})

		
	}
}
