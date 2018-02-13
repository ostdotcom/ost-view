"use strict"
/**
 * Model to fetch all search related details from database or from chain.
 *
 * @module models/search
 */

// load all internal dependencies
const rootPrefix = ".."
  , constants = require(rootPrefix + '/config/core_constants')
  , coreConfig = require(rootPrefix + '/config')
  , rpcInteract = require(rootPrefix + '/lib/web3/interact/rpc_interact')

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
  
  this._utilityInteractInstance = rpcInteract.getInstance(chainId);

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

      if (argument == undefined) {
        reject('invalid input');
        return;

      }

      if (argument.length === constants.ACCOUNT_HASH_LENGTH) {
        oThis._utilityInteractInstance.isContract(argument)
          .then(function(response){
            resolve("/contract/"+argument);
          })
          .catch(function(reason){

            resolve("/address/"+argument);
          });

      }else if(argument.length === constants.TRANSACTION_HASH_LENGTH){

          resolve("/transaction/"+argument);
      }else if(!isNaN(argument)){
                          console.log("*** 4 ***");

          resolve("/block/"+argument);
      }else{
          reject('invalid input');
      }
    });
  }
     
}
