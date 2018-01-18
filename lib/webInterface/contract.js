"use strict";

//All modeules required.
const reqPrefix           = "../.."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
    , logger = require(reqPrefix + '/helpers/CustomConsoleLogger')
    , dbInteract = require(reqPrefix + '/helpers/db/interact')
    , constants = require(reqPrefix + '/config/core_constants')    
;


var contract = module.exports = function(webRPC, chainDBConfig){
  this._dbInstance = dbInteract.getInstance(chainDBConfig);
}


contract.prototype = {

	getContractLedger : function(contractAddress, page){
    const oThis = this;

    return new Promise(function(resolve, reject){
    
      if (contractAddress == undefined || contractAddress.length != constants.ACCOUNT_HASH_LENGTH ) {
          reject ("invalid input");
          return;
      }

      if (page == undefined || !page || isNaN(page) || page < 0) {
        page = constants.DEFAULT_PAGE_NUMBER;
      }

      oThis._dbInstance.getContractLedger(contractAddress, page, constants.ACCOUNT_HASH_LENGTH)
        .then(function(response){
          resolve(response);
        })
        .catch(function(reason){
          reject(reason);
        });

    });
  }
};
