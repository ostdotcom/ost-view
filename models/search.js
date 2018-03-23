"use strict"
/**
 * Model to fetch all search related details from database or from chain.
 *
 * @module models/search
 */

// load all internal dependencies
const rootPrefix = ".."
  , constants = require(rootPrefix + '/config/core_constants')
  , dbInteract = require(rootPrefix + '/lib/storage/interact')
  , coreConfig = require(rootPrefix + '/config')
  , rpcInteract = require(rootPrefix + '/lib/web3/interact/rpc_interact')
  , brandedTokenModelKlass = require(rootPrefix + '/app/models/branded_token')
;

// Class related constants
const balanceIndex = 0
  , transactionsIndex = 1;

/**
 * @constructor
 *
 * @param  {Integer} chainId - chain id to connect to respective geth node and database instance
 */

var search = module.exports = function (chainId) {

  this.chainId = chainId;
  this._utilityInteractInstance = rpcInteract.getInstance(chainId);
  this._dbInstance = dbInteract.getInstance(coreConfig.getChainDbConfig(chainId));

};

search.prototype = {

  /**
   *On the basis of argument passed to function, function makes decision and serves respective data.
   *
   *@param {string/Integer} argument - argument may contains address_hash, transaction_hash or block_number.
   *
   *@return {Promise}
   */
  getParamData: function (argument) {

    const oThis = this;

    return new Promise(function (resolve, reject) {

      if (argument === undefined) {
        reject(argument);
        return;
      }
      if (argument.length === constants.ACCOUNT_HASH_LENGTH) {

        isContractAddress(argument)
          .then(function(isContract){
            if (isContract) {
              resolve("/tokendetails/"+argument);
            }else{
              resolve("/address/"+argument);
            }
          })
          .catch(function(){
            resolve("/address/"+argument);
          })

      }else if(argument.length === constants.TRANSACTION_HASH_LENGTH){

          resolve("/transaction/"+argument);
      }else if(!isNaN(argument)){

          resolve("/block/"+argument);
      }else{

        oThis._dbInstance.getContractAddressFromBrandedTokenNameOrSymbol(argument)
          .then(function(contractAddress){
            resolve("/tokendetails/"+contractAddress);
          })
          .catch(function(){
            reject(argument);
          });

      }
    });
  }

}


function isContractAddress(address){
  return new brandedTokenModelKlass().select(['contract_address']).where(['contract_address=?',address]).fire()
    .then(function(queryResponse){
      if (queryResponse && queryResponse.length > 0){
        return true;
      }
        return false;
    })
    .catch(function(reason){
      return false;
    })
}
