"use strict"
/**
 * Model to fetch all block related details from database or from chain.
 *
 * @module models/block
 */

// load all internal dependencies
const rootPrefix = ".."
  , rpcInteract = require(rootPrefix + "/lib/web3/interact/rpc_interact")
  , dbInteract = require(rootPrefix + '/lib/storage/interact')
  , constants = require(rootPrefix + '/config/core_constants')
  , coreConfig = require(rootPrefix + '/config')
  , configHelper = require(rootPrefix + '/helpers/configHelper')
  ;

const und = require('underscore');


/**
 * @constructor
 *
 * @param  {Integer} chainId - chain id to connect to respective geth node and database instance
 */
var block = module.exports = function (chainId) {
  this._utilityInteractInstance = rpcInteract.getInstance(chainId);
  this._dbInstance = dbInteract.getInstance(coreConfig.getChainDbConfig(chainId));
}

block.prototype = {

  /**
   * Fetches block details for requested block number.
   *
   * @param {Integer} blockNumber - Number of block to be fetched.
   *
   * @return {Promise<Object>} A hash of block data.
   */
  getBlockFromBlockNumber: function (blockNumber) {

    const oThis = this;

    return new Promise(function (resolve, reject) {
      if (blockNumber == undefined || isNaN(blockNumber)) {
        reject("invalid input");
        return;
      }

      var promiseResolver = [];

      promiseResolver.push(oThis._dbInstance.getBlockFromBlockNumber(blockNumber));
      promiseResolver.push(oThis._dbInstance.getBlockTokenTransactionNumber(blockNumber));

      Promise.all(promiseResolver)
        .then(function(values){

          var blockDetails = values[0]
          ,tokenTransactionCount = values[1]
          ;

          blockDetails['total_token_transactions'] = tokenTransactionCount;

          resolve(blockDetails);
        })
        .catch(function(reason){
          reject(reason);
        });

    });
  }

  /**
   * Fetches block details for requested block hash.
   *
   * @param {Integer} blockHash - hash of block to be fetched.
   *
   * @return {Promise<Object>} A hash of block data.
   */
  , getBlockFromBlockHash: function (blockHash) {

    const oThis = this;

    return new Promise(function (resolve, reject) {
      if (!blockHash.startsWith("0x")) {
        reject("invalid input");
        return;
      }

      oThis._dbInstance.getBlockFromBlockHash(blockHash)
        .then(function (response) {
          resolve(response[0]);
        })
        .catch(function (reason) {
          reject(reason);
        });
    });
  }

  /**
   * Get list of transactions available in a given block number.
   *
   * @param {Integer} blockNumber - block number
   * @param {Integer} page - page number
   *
   * @return {Promise<Object>} List of transactions available in database for particular batch.
   */
  , getBlockTransactions: function (blockNumber, pageSize, pagePayload) {
      const oThis = this;

      if (blockNumber == undefined) {

        return Promise.reject("invalid input");

      }

      if (blockNumber.startsWith("0x")) {
        return oThis._dbInstance.getBlockTransactionsFromBlockHash(blockNumber, pageSize, pagePayload);

      } else {
        return oThis._dbInstance.getBlockTransactionsFromBlockNumber(blockNumber, pageSize, pagePayload);

      }
  }

  /**
   * Get list of token transactions available in a given block number.
   *
   * @param {Integer} blockNumber - block number
   * @param {Integer} page - page number
   * @param {hash} pagePayload - page payload
   *
   * @return {Promise<Object>} List of transactions available in database for particular batch.
   */
  , getBlockTokenTransactions: function (blockNumber, pageSize, pagePayload) {
    const oThis = this;

    return new Promise(function(resolve, reject){

      if (blockNumber == undefined) {
        reject("invalid input");
        return;
      }

      oThis._dbInstance.getBlockTokenTransactionsFromBlockNumber(blockNumber, pageSize, pagePayload)
        .then(function(queryResponse){

          var contractArray = [];
          queryResponse.forEach(function(object){
            contractArray.push(object.contract_address);
          });
          contractArray = und.uniq(contractArray);

          configHelper.getContractDetailsOfAddressArray(oThis._dbInstance, contractArray)
            .then(function(addressHash){
              resolve({tokenTransactions: queryResponse, contractAddresses: addressHash});
            })
            .catch(function(reason){
              resolve({tokenTransactions:queryResponse})
            });
        })
        .catch(function(reason){
          reject(reason);
        });
    });
  }


  /**
   * Get list of recent blocks for given page number.
   *
   * @param {Integer} page - Page name
   *
   * @return {Promise<Object>} list of blocks by recency
   */
  , getRecentBlocks: function (page) {
    const oThis = this;
    return new Promise(function (resolve, reject) {
      if (page == undefined || isNaN(page)) {
        reject('invalid input');
        return;
      }

      if (!page || page < 0) {
        page = constants.DEFAULT_PAGE_NUMBER;
      }

      oThis._dbInstance.getRecentBlocks(page, constants.DEFAULT_PAGE_SIZE)
        .then(function (response) {
          resolve(response);
        })
        .catch(function (reason) {
          reject(reason)
        });
    });
  }
};

