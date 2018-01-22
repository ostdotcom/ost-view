"use strict"
/**
 * Model to fetch all search related details from database or from chain.
 *
 * @module models/search
 */

// load all internal dependencies
const rootPrefix = ".."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , constants = require(rootPrefix + '/config/core_constants')
  , block = require(rootPrefix + '/models/block')
  , transaction = require(rootPrefix + '/models/transaction')
  , address = require(rootPrefix + '/models/address')
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
  this._address = new address(chainId);
  this._block = new block(chainId);
  this._transaction = new transaction(chainId);
}

search.prototype = {

  /**
   *On the basis of argument passed to function, function makes decision and serves respective data.
   *
   *@param {string/Integer} argument - argument may contains address_hash, transaction_hash or block_number.
   *
   *@return {Promise}
   */
  getParamData: function (argument) {

    if (argument == undefined) {
      reject('invalid input');
      return;

    }
    if (argument.length == constants.ACCOUNT_HASH_LENGTH) {

      const oThis = this;

      return new Promise(function (resolve, reject) {
        var promiseResolvers = [];

        promiseResolvers.push(oThis._address.getAddressBalance(argument));
        promiseResolvers.push(oThis._address.getAddressTransactions(argument, constants.DEFAULT_PAGE_SIZE));

        Promise.all(promiseResolvers).then(function (rsp) {

          const balanceValue = rsp[balanceIndex];
          const transactionsValue = rsp[transactionsIndex]

          const response = responseHelper.successWithData({
            balance: balanceValue,
            transactions: transactionsValue
          });

          resolve(response);
        });

      });

    } else if (argument.length == constants.TRANSACTION_HASH_LENGTH) {

      const oThis = this;

      return new Promise(function (resolve, reject) {
        getTransaction(argument, oThis)
          .then(function (response) {
            resolve(responseHelper.successWithData({"transaction": response, "result_type": "transaction"}))
          })
      });

    } else if (!isNaN(argument)) {
      const oThis = this;

      return new Promise(function (resolve, reject) {
        getBlock(argument, oThis)
          .then(function (response) {
            resolve(responseHelper.successWithData({"block": response, "result_type": "block"}))
          })
      });

    } else {
      reject('invalid input');
    }
  }
}

function getBlock(block_number, oThis) {
  return Promise.resolve(oThis._block.getBlock(block_number));
}

function getTransaction(hash, oThis) {
  return Promise.resolve(oThis._transaction.getTransaction(hash));
}

