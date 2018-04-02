"use strict";
/**
 * Verify fetched blocks and update them, if required
 *
 * @module lib/block_utils/block_verifier
 */
const rootPrefix = "../.."
  , logger = require(rootPrefix + "/helpers/custom_console_logger")
  , BlockFetcher = require(rootPrefix + "/lib/block_utils/block_fetcher")
  , blockConst = require(rootPrefix + "/lib/global_constant/block")
  , BlockKlass = require(rootPrefix + "/app/models/block")
  , TransactionKlass = require(rootPrefix + "/app/models/transaction")
  , TransactionExtendedDetailKlass = require(rootPrefix + "/app/models/transaction_extended_detail")
  , TokenTransferKlass = require(rootPrefix + "/app/models/token_transfer")
  , AddressTransactionKlass = require(rootPrefix + "/app/models/address_transaction")
  , AddressTokenTransferKlass = require(rootPrefix + "/app/models/address_token_transfer")
;

/**
 * Constructor to create object of BlockVerifier
 *
 * @param {Integer} chainId - chainId of the block chain
 * @constructor
 */
const BlockVerifier = function (chainId) {
  this.chainId = chainId;
};

/**
 * Method to repopulate block of blockNumber.
 *
 * @param  {Integer} blockNumber - Block Number
 * @param  {Callback} verificationCompleteCallback - verification complete callback
 *
 * @return {null}
 */
BlockVerifier.prototype.repopulateBlock = function (blockNumber, verificationCompleteCallback) {
  logger.info('**Repopulate Block** blockNumber-', blockNumber);

  this.callback = verificationCompleteCallback;
  var oThis = this;

  // if fetcher does not verify block - check block hash if changed {checkForBlockHash function} , only then proceed.
  // block difference of 10 is maintained right now by fetcher

  oThis.correctBlockInconsistency(blockNumber)
    .then(function () {
      oThis.callback();
    })
    .catch(async function (err) {
      const blockObj = new BlockKlass(oThis.chainId);

      await blockObj.update({verified: blockObj.invertedVerified[blockConst.unverified], status: blockObj.invertedStatuses[blockConst.failed]})
        .where({blockNumber: blockNumber}).fire();

      logger.notify('bv_rb_1', 'Exception in repopulateBlock', err);
      process.exit(1);
    });
};
//
// /**
//  * To check the block hash from geth and from DB
//  *
//  * @param  {Integer} blockNumber - BlockNumber of the block
//  *
//  * @return {Promise}
//  */
// BlockVerifier.prototype.checkForBlockHash = function (blockNumber) {
//   logger.info('**Checking for block hash**');
//
//   var oThis = this;
//
//   return new Promise(function (resolve, reject) {
//     oThis.web3Interact.getBlock(blockNumber)
//       .then(function (response) {
//         const web3BlockHash = response.data.hash;
//         oThis.dbInteract.getBlockFromBlockNumber(blockNumber)
//           .then(function (response) {
//             if (response.block_hash) {
//               logger.info('web3 hash and DB hash :', web3BlockHash, response.block_hash);
//               resolve(web3BlockHash.toLowerCase() == response.block_hash.toLowerCase());
//             } else {
//               reject("hash of response not defined");
//             }
//           });
//       });
//   });
// };

// /**
//  * To Check block verified flag from the DB.
//  *
//  * @param  {Integer} blockNumber - BlockNumber of the block
//  *
//  * @return {Promise}
//  */
// BlockVerifier.prototype.isBlockVerified = function (blockNumber) {
//
//   var oThis = this;
//
//   return new Promise(function (resolve, reject) {
//     oThis.dbInteract.getBlockFromBlockNumber(blockNumber)
//       .then(function (response) {
//         if (response) {
//           resolve(response.verified)
//         } else {
//           reject('verified attribute of response not defined');
//         }
//       });
//   });
// };

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
        var blockFetcher = BlockFetcher.newInstance(oThis.chainId, true);
        blockFetcher.fetchAndUpdateBlock(blockNumber, function (res) {
          resolve(res);
        });
      }, reject);
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
  logger.log('Start deleteAllDataForBlock');

  return new Promise(function (resolve, reject) {

    const transactionObj = new TransactionKlass(oThis.chainId)
      , txnHashIdArray = []
    ;

    transactionObj.select(['transaction_hash_id']).where({block_number: blockNumber}).fire().then(function (queryResponseRows) {
      logger.log("transaction_hash_ids to be deleted count", queryResponseRows.length);

      queryResponseRows.forEach(function (transactionRow) {
        txnHashIdArray.push(transactionRow.transaction_hash_id);
      });

      return txnHashIdArray;
    })
      .then(function (i_d_k) {
        logger.log('Transactions to be deleted::', txnHashIdArray);

        var promiseList = [];

        const transactionExtendedDetailObj = new TransactionExtendedDetailKlass(oThis.chainId)
          , tokenTransferObj = new TokenTransferKlass(oThis.chainId)
          , addressTransactionObj = new AddressTransactionKlass(oThis.chainId)
          , addressTokenTransferObj = new AddressTokenTransferKlass(oThis.chainId)
        ;

        logger.log('Starting Deletion in TransactionExtendedDetail, TokenTransfer, AddressTransaction & AddressTokenTransfer table');

        promiseList.push(transactionExtendedDetailObj.delete().where({transaction_hash_id: txnHashIdArray}).fire());
        promiseList.push(tokenTransferObj.delete().where({transaction_hash_id: txnHashIdArray}).fire());
        promiseList.push(addressTransactionObj.delete().where({transaction_hash_id: txnHashIdArray}).fire());
        promiseList.push(addressTokenTransferObj.delete().where({transaction_hash_id: txnHashIdArray}).fire());

        return Promise.all(promiseList);

      })
      .then(function (i_d_k) {
        logger.log('Starting Deletion in Transaction table');

        const transactionObj = new TransactionKlass(oThis.chainId);
        return transactionObj.delete().where({transaction_hash_id: txnHashIdArray}).fire();

      })
      .then(function (i_d_k) {

        logger.log('Starting Deletion in Block table');

        const blockObj = new BlockKlass(oThis.chainId);
        const deletResponsePromise = blockObj.delete().where({block_number: blockNumber}).fire();

        resolve(deletResponsePromise);
      })
      .catch(function (err) {
        logger.error("Error in deleteAllDataForBlock. Error:: ", err);
        reject(err);
      });
  });
};

module.exports = {
  newInstance: function (chainId) {
    return new BlockVerifier(chainId);
  }
};