"use strict"

var block = require('./block')
var transaction = require('./transaction')
var address = require('./address')

const accountLength = 42
const transactionLenght = 66

var search = {

	getParamData : function(argument) {

		if (argument == undefined) {
			reject('invalid input');
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
		return block.getBlock(block_number);
	}

	,getTransaction : function(hash){
		return transaction.getTransaction(hash);
	}

	,getAccount : function(hash){
		return address.getAddressData(hash);
	}
}

module.exports = search;
