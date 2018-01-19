"use strict";


/** @module lib/webInterface/blocks */


//All modeules required.
const reqPrefix           = "../.."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
    , rpcInteract = require(reqPrefix + "/lib/web3/interact/rpc_interact")
    , dbInteract = require(reqPrefix + '/helpers/db/interact')
    , constants = require(reqPrefix + '/config/core_constants')    
;


var blocks = module.exports = function(webRpcUrl, chainDBConfig){
  this._utilityInteractInstance = new rpcInteract(webRpcUrl);
  this._dbInstance = dbInteract.getInstance(chainDBConfig);

  this._currentInstance =  this._dbInstance;

}


blocks.prototype = {

/** 
  *gives list of blocks for given page number
  *
  *@param {Number} page - page number for getting  
  *
  *@return{Promise}
  */
	getRecentBlocks : function(page){
    const oThis = this;
    return new Promise(function(resolve, reject){
      if (page ==  undefined || isNaN(page)) {
        reject('invalid input');
        return;
      }

      if (!page || page <0) {
  			page = constants.DEFAULT_PAGE_NUMBER;
  		}


  		oThis._currentInstance.getRecentBlocks(page, constants.DEFAULT_PAGE_SIZE)
        .then(function(response){
          resolve(response);
        })
        .catch(function(reason){
            reject(reason)
        });
    });
	}
};

