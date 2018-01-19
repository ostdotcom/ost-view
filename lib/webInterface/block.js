"use strict";

//All modeules required.
const reqPrefix           = "../.."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
    , rpcInteract = require(reqPrefix + "/lib/web3/interact/rpc_interact")
    , dbInteract = require(reqPrefix + '/helpers/db/interact')
    , constants = require(reqPrefix + '/config/core_constants')
;


var block = module.exports = function(webRpcUrl, chainDBConfig){
	this._utilityInteractInstance = new rpcInteract(webRpcUrl);
	this._dbInstance = dbInteract.getInstance(chainDBConfig);

	this._currentInstance =  this._dbInstance;
}

block.prototype = {

  /** 
	*gives data for given address
	*
	*@param {string} hash - hash of address to be fetched
	*
	*@return{Promise}
  	*/
	getBlock : function(block_number){

		const oThis = this;

		return new Promise(function(resolve, reject){
			if (block_number == undefined || isNaN(block_number)){
				reject ("invalid input");
				return;
			}

			oThis._currentInstance.getBlock(block_number)
				.then(function(response){
					resolve(response[0]);	
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
		const oThis =  this;
		return new Promise(function(resolve, reject){

			if (block_number == undefined || isNaN(page)){
				reject ("invalid input");
				return;
			}

			if (page == undefined || !page || page < 0) {
				page = constants.DEFAULT_PAGE_NUMBER;
			}

			oThis._currentInstance.getBlockTransactions(block_number,page,constants.ACCOUNT_HASH_LENGTH)
				.then(function(response){
					resolve(response);
				})
				.catch(function(reason){
					reject(reason);
			});		
		})	
	}
}

