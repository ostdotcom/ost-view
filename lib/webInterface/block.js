"use strict";

//All modeules required.
const reqPrefix           = "../.."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
    , core_addresses = require( reqPrefix + "/config/core_addresses")
    , utility_interact = require(reqPrefix + "/lib/web3/interact/utility_interact")
    , dbInteract = require(reqPrefix + '/helpers/db/interact')
   	, coreConstants = require(reqPrefix +'/config/core_constants');

;

const blockTransactionsPageSize = 10;


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

			var utilityInteractInstance = new utility_interact(coreConstants.OSTE_GETH_UTILITY_RPC_PROVIDER);

			utilityInteractInstance.getBlock(block_number)
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
			if (block_number == undefined || isNaN(page)){
				reject (responseHelper.error('r_wi_1', "Something Went Wrong"));
								return;
			}

			if (page == undefined || !page || page < 0) {
				page = 1;
			}

			dbInteract.getBlockTransactions(block_number,page,blockTransactionsPageSize)
				.then(function(response){
					resolve(responseHelper.successWithData(response));
				})
				.catch(function(reason){
					reject(reason);
			});		
		})	
	}
}


module.exports = block;