"use strict";

//All modeules required.
const reqPrefix           = "../.."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
    , rpcInteract = require(reqPrefix + "/lib/web3/interact/rpc_interact")
    , logger = require(reqPrefix + '/helpers/CustomConsoleLogger')
    , dbInteract = require(reqPrefix + '/helpers/db/interact')

;

//constant
/** @constant {Number} */
const blocksPageSize = 10;

var blocks = module.exports = function(webRPC, chainDBConfig){
  this._utilityInteractInstance = new rpcInteract(webRPC);
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
  			page = 0;
  		}


  		oThis._currentInstance.getRecentBlocks(page, blocksPageSize)
        .then(function(response){
          resolve(responseHelper.successWithData(response));
        })
        .catch(function(reason){
            reject(reason)
        });
    });
	}
};

