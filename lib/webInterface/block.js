"use strict";


 /** @module lib/webInterface/ */


//All modeules required.
const reqPrefix           = "../.."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
    , rpcInteract = require(reqPrefix + "/lib/web3/interact/rpc_interact")
    , dbInteract = require(reqPrefix + '/helpers/db/interact')
    , constants = require(reqPrefix + '/config/core_constants')
;

/**
 * @constructor
 * 
 * @param  {String} webRpcUrl - a webRpcUrl that identifies which RPC instance has to create.
 * @param  {Object} chainDBConfig - a hash which contains information to setup database connection and database name.
 */
var block = module.exports = function(webRpcUrl, chainDBConfig){
	this._utilityInteractInstance = new rpcInteract(webRpcUrl);
	this._dbInstance = dbInteract.getInstance(chainDBConfig);

	this._currentInstance =  this._dbInstance;
}

block.prototype = {

  /** 
	*Fetches block for requested block number.
	*
	*@param {Integer} block_number - Number of block to be fetched.
	*
	*@return {Promise} A hash of block data.
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
	*Servers list of transactions available in given block number.
	*
	*@param {Number} block_number - block number of which transactions to be fetched.
	*@param {Integer} page - Page locating a index from where list has to be fetched.
	*
	*@return {Promise} List of transactions available in database for particular batch.
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

