"use strict";

//All modeules required.
const reqPrefix           = "../.."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
    , logger = require(reqPrefix + '/helpers/CustomConsoleLogger')
    , dbInteract = require(reqPrefix + '/helpers/db/interact')
;

//constant
/** @constant {Number} */
const contractPageSize = 10;

const contractAddressLenght = 42;

var contract = module.exports = function(webRPC, chainDBConfig){
  this._dbInstance = dbInteract.getInstance(chainDBConfig);
}


contract.prototype = {

	getContractLedger : function(contractAddress, page){
    const oThis = this;

    return new Promise(function(resolve, reject){
    
      if (contractAddress == undefined || contractAddress.length != contractAddressLenght ) {
          reject (responseHelper.error('r_wi_1', "Something Went Wrong"));

                  return;
      }

      if (page == undefined || !page || isNaN(page) || page < 0) {
        page = 1;
      }

      oThis._dbInstance.getContractLedger(contractAddress, page, contractPageSize)
        .then(function(response){
          resolve(responseHelper.successWithData(response));
        })
        .catch(function(reason){
          reject(reason);
        });

    });
  }
};
