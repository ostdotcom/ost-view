"use strict"


var block = require('./block')
var transaction = require('./transaction')

var search = {


	getParamData : function(argument) {

		if (argument == undefined) {
			return;
		}

		if (isNaN(argument)) {
			return this.getBlock(argument)
		}else{
			return this.getTransaction(argument)
		}
	}

	,getBlock : function(block_number){
		return block.getBlock(block_number);
	}

	,getTransaction : function(hash){
		return transaction.getTransaction(hash);
	}
}


module.exports = search;
