"use strict";

//All modeules required.
const reqPrefix           = "../.."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
    , utility_interact = require(reqPrefix + "/lib/web3/interact/utility_interact")
    , logger = require(reqPrefix + '/helpers/CustomConsoleLogger')
    , coreConstants = require(reqPrefix +'/config/core_constants');

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
    
      if (contarctAddress == undefined || contarctAddress.length != contractAddressLenght ) {
          reject (responseHelper.error('r_wi_1', "Something Went Wrong"));
                  return;
      }

      if (page == undefined || !page || isNaN(page) || page < 0) {
        page = 1;
      }

      oThis._dbInstance.getContractLedger(contarctAddress, page, contractPageSize)
        .then(function(response){
          resolve(responseHelper.successWithData(response));
        })
        .catch(function(reason){
          reject(reason);
        });

    });
  }
};
