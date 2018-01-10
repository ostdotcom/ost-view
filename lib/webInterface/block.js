"use strict";

//All modeules required.
const reqPrefix           = "../.."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
    , core_addresses = require( reqPrefix + "/config/core_addresses")
    , utility_interact = require(reqPrefix + "/lib/web3/interact/utility_interact")
;

var block = {

  /** 
	*gives data for given address
	*
	*@param {string} hash - hash of address to be fetched
	*
	*@return{Promise}
  	*/
	getBlock : function(block_number){

		return new Promise(function(resolve, reject){
			if (block_number == undefined || isNaN(block_number)){
				reject (responseHelper.error('r_wi_1', "Something Went Wrong"));
								return;

			}

			utility_interact.getBlock(block_number)
				.then(function(response){
					resolve(responseHelper.successWithData({"block" : response}));
				})
				.catch(function(reason){
					reject(reason);
				});
		});
	}

  /** 
	*gives list of transactions for given block number
	*
	*@param {Number} block_number - block number of which transactions to be fetched
	*@param {Number} page - page number for pagination
	*
	*@return{Promise}
  	*/
	,getBlockTransactions : function(block_number, page){

		return new Promise(function(resolve, reject){
			if (address == undefined || isNaN(page)){
				reject (responseHelper.error('r_wi_1', "Something Went Wrong"));
								return;
			}

			if (page == undefined || !page || page < 0) {
				page = 0;
			}

			resolve(getDummyBlcokTransactions(address, page));
		})	
	}
}


function getDummyBlcokTransactions(address, page){
	var blockParam = {
		'address' : address,
		'page' : page
	}

	return responseHelper.successWithData( blockParam );
}

module.exports = block;