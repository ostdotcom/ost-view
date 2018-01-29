"use strict"
/**
 * Varify fetched blocks and update them, if required
 *
 * @module lib/block_utils/block_verifier
 */
const rootPrefix = "../.."
  , logger = require(rootPrefix + "/helpers/custom_console_logger")
  , erctoken = require(rootPrefix + "/lib/contract_interact/erc20Token")
  , constants = require(rootPrefix + "/config/core_constants")
  , BlockFetcher = require(rootPrefix + "/lib/block_utils/block_fetcher")
;

const LARGEST_NUMBER = 1000000000;

/**
 * Constructor to create object of BlockVerifier
 *
 * @param {Object} web3Interact - Web3RPC Object
 * @param {Object} dbInteract - DB object to interact
 * @constructor
 */
const BlockVerifier = function (web3Interact, dbInteract) {
  this.web3Interact = web3Interact;
  this.dbInteract = dbInteract;
};

/**
 * Method to verify block of blockNumber. First to check the verify flag from DB.
 * If false, Check for block hash from geth and from DB
 * if inconsistent, correct the data.
 *
 * @param  {Integer} blockNumber - Block Number
 * @param  {Callback} verificationCompleteCallback - verification compelete callback
 *
 * @return {null}
 */
BlockVerifier.prototype.verifyBlock = function (blockNumber, verificationCompleteCallback) {
  logger.info('**Verifying Block**');

  this.callback = verificationCompleteCallback;
  var oThis = this;

  oThis.isBlockVerified(blockNumber)
    .then(function (verified) {
      if (!verified) {
        return oThis.checkForBlockHash(blockNumber)
          .then(function (consistent) {
            logger.log("Block hash consistency :", consistent);
            if (consistent) {
              return oThis.dbInteract.updateVerifiedFlag(blockNumber);
            } else {
              return oThis.correctBlockInconsistency(blockNumber);
            }
          })
      }
    })
    .then(function () {
      oThis.callback(+blockNumber + 1)
    })
    .catch(function (err) {
      logger.error(err);
      oThis.callback(blockNumber);
    });
};

/**
 * To check the block hash from geth and from DB
 *
 * @param  {Integer} blockNumber - BlockNumber of the block
 *
 * @return {Promise}
 */
BlockVerifier.prototype.checkForBlockHash = function (blockNumber) {
  logger.info('**Checking for block hash**');

  var oThis = this;

  return new Promise(function (resolve, reject) {
    oThis.web3Interact.getBlock(blockNumber)
      .then(function (response) {
        const web3BlockHash = response.data.hash;
        oThis.dbInteract.getBlock(blockNumber)
          .then(function (response) {
            if (response[0].block_hash) {
              logger.info('web3 hash and DB hash :', web3BlockHash, response[0].block_hash);
              resolve(web3BlockHash == response[0].block_hash);
            } else {
              reject("hash of response not defined");
            }
          });
      });
  });
};

/**
 * To Check block verified flag from the DB.
 *
 * @param  {Integer} blockNumber - BlockNumber of the block
 *
 * @return {Promise}
 */
BlockVerifier.prototype.isBlockVerified = function (blockNumber) {

  var oThis = this;

  return new Promise(function (resolve, reject) {
    oThis.dbInteract.getBlock(blockNumber)
      .then(function (response) {
        if (response[0]) {
          resolve(response[0].verified)
        } else {
          reject('verified attribute of response not defined');
        }
      });
  });
};

/**
 * It Clears the DB of all the data related to that blockNumber.
 * And then insert fresh data of that blockNumber
 *
 * @param  {Integer} blockNumber - BlockNumber of the block
 *
 * @return {Promise}
 */
BlockVerifier.prototype.correctBlockInconsistency = function (blockNumber) {

  var oThis = this;

  return new Promise(function (resolve, reject) {
    // Delete Block Related data
    oThis.deleteAllDataForBlock(blockNumber)
      .then(function () {
        var blockFetcher = BlockFetcher.newInstance(oThis.web3Interact, oThis.dbInteract, true);
        blockFetcher.fetchAndUpdateBlock(blockNumber, function (res) {
          resolve();
        });
      });
  });
};

/**
 * To Delete all the data related to the blockNumber of the block.
 *
 * @param  {Integer} blockNumber - BlockNumber of the block
 *
 * @return {Promise}
 */
BlockVerifier.prototype.deleteAllDataForBlock = function (blockNumber) {

  var oThis = this;

  return new Promise(function (resolve, reject) {

    oThis.dbInteract.deleteBlock(blockNumber)
    oThis.dbInteract.getBlockTransactions(blockNumber, 1, LARGEST_NUMBER)
      .then(function (response) {
        var txnHashArray = [];
        if (response.constructor === Array) {
          for (var ind in response) {
            var txn = response[ind];
            txnHashArray.push(txn.hash);
          }
        }
        logger.log('Transactions to be deleted :', txnHashArray);

        var promiseList = [];

        var addressTokenTransactions = oThis.dbInteract.deleteAddressTokenTransactions(txnHashArray);
        promiseList.push(addressTokenTransactions);

        var tokenTransactions = oThis.dbInteract.deleteTokenTransactions(txnHashArray);
        promiseList.push(tokenTransactions);

        var addressTransactions = oThis.dbInteract.deleteAddressTransactions(txnHashArray);
        promiseList.push(addressTransactions);

        var transactions = oThis.dbInteract.deleteTransactions(txnHashArray);
        promiseList.push(transactions);

        Promise.all(promiseList)
          .then(function (response) {
            logger.log(response);
            resolve();
          });
      });
  });
};

module.exports = {
  newInstance: function (web3Interact, dbInteract) {
    return new BlockVerifier(web3Interact, dbInteract);
  }
};