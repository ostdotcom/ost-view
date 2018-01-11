"use strict"


//All modules required.
var block = require('./block')
var transaction = require('./transaction')
var address = require('./address')

	
/** @constant {Number} */
const accountLength = 42
/** @constant {Number} */
const transactionLenght = 66

var search = module.exports = function(webRPC, chainDBConfig){
	this._address = new address(webRPC, chainDBConfig);
	this._block = new block(webRPC, chainDBConfig);
	this._transaction = new transaction(webRPC, chainDBConfig);

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
		if (argument.length == accountLength) {

			return this.getAccount(argument);
		
		}else if(argument.length == transactionLenght) {

			return this.getTransaction(argument);
		
		}else if(!isNaN(argument)){

		 	return this.getBlock(argument);
		 	
		}else{
			reject('invalid input');
		}
	}

	,getBlock : function(block_number){
		return Promise.resolve(this._block.getBlock(block_number));
	}

	,getTransaction : function(hash){
		return Promise.resolve(this._transaction.getTransaction(hash));
	}

	,getAccount : function(hash){
		return Promise.resolve(this._address.getAddressData(hash));
	}
}

module.exports = search;
