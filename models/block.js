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
;

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
   * @param {Integer} block_number - Number of block to be fetched.
   *
   * @return {Promise<Object>} A hash of block data.
   */
  getBlock: function (block_number) {

    const oThis = this;

    return new Promise(function (resolve, reject) {
      if (block_number == undefined || isNaN(block_number)) {
        reject("invalid input");
        return;
      }

      oThis._dbInstance.getBlock(block_number)
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
   * @param {Integer} block_number - block number
   * @param {Integer} page - page number
   *
   * @return {Promise<Object>} List of transactions available in database for particular batch.
   */
  , getBlockTransactions: function (block_number, page) {
    const oThis = this;
    return new Promise(function (resolve, reject) {

      if (block_number == undefined || isNaN(page)) {
        reject("invalid input");
        return;
      }

      if (page == undefined || !page || page < 0) {
        page = constants.DEFAULT_PAGE_NUMBER;
      }

      oThis._dbInstance.getBlockTransactions(block_number, page, constants.ACCOUNT_HASH_LENGTH)
        .then(function (response) {
          resolve(response);
        })
        .catch(function (reason) {
          reject(reason);
        });
    })
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

