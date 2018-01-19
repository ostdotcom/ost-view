"use strict"


//All modules required.
var block = require('./block')
var transaction = require('./transaction')
var address = require('./address')

const reqPrefix           = "../.."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
    , constants = require(reqPrefix + '/config/core_constants')        
   ;
	
const balanceIndex = 0;
const transactionsIndex = 1;
const defaultPageNumber = 1;

var search = module.exports = function(webRpcUrl, chainDBConfig){
	this._address = new address(webRpcUrl, chainDBConfig);
	this._block = new block(webRpcUrl, chainDBConfig);
	this._transaction = new transaction(webRpcUrl, chainDBConfig);
}

search.prototype = {


  /** 
  	*On the basis of argument passed to function, function makes decision and serves respective data.
  	*
  	*@param {string} argument - argument may contains address_hash, transaction_hash or block_number 
  	*
  	*@return{Promise}
  	*/
	getParamData : function(argument) {

		if (argument == undefined) {
			reject('invalid input');
							return;

		}
		if (argument.length == constants.ACCOUNT_HASH_LENGTH) {

			const oThis = this;

			return new Promise(function(resolve, reject){
				var promiseResolvers = [];

		 		promiseResolvers.push(oThis._address.getAddressBalance(argument));
 	    		promiseResolvers.push(oThis._address.getAddressTransactions(argument, constants.DEFAULT_PAGE_SIZE));

 	    		Promise.all(promiseResolvers).then(function(rsp) {
		
					const balanceValue = rsp[balanceIndex];
					const transactionsValue = rsp[transactionsIndex]

					const response = responseHelper.successWithData({
						balance : balanceValue, 
						transactions : transactionsValue
					});

					resolve(response);
	  	 		});

		 	});		
		
		}else if(argument.length == constants.TRANSACTION_HASH_LENGTH) {

			const oThis = this;

			return new Promise(function(resolve, reject){
		 		getTransaction(argument, oThis)
		 			.then((response) =>{
		 				resolve(responseHelper.successWithData({"transaction" : response,"result_type":"transaction"}))
		 			})
		 	});		

		}else if(!isNaN(argument)){
			const oThis = this;

			return new Promise(function(resolve, reject){
		 		getBlock(argument, oThis)
		 			.then((response) =>{
		 				resolve(responseHelper.successWithData({"block" : response,"result_type":"block"}))
		 			})
		 	});
		 	
		}else{
			reject('invalid input');
		}
	}
}

function getBlock (block_number, oThis){
	return Promise.resolve(oThis._block.getBlock(block_number));	
}

function getTransaction (hash, oThis){
	return Promise.resolve(oThis._transaction.getTransaction(hash));
}

