"use strict";
/**
 * Fetch blocks from chain and feed them into the provided DB.
 *
 * @module lib/block_utils/block_fetcher
 */
const rootPrefix = "../.."
  , logger = require(rootPrefix + "/helpers/custom_console_logger")
  , constants = require(rootPrefix + "/config/core_constants")
  , core_config = require(rootPrefix + "/config")
  , BlockKlass = require(rootPrefix + "/app/models/block")
  , blockConst = require(rootPrefix + '/lib/global_constant/block')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , Web3Interact = require(rootPrefix + "/lib/web3/interact/rpc_interact")
  , TransactionProcessor = require(rootPrefix + "/lib/block_utils/transaction_processor")
;

const MAX_BATCH_SIZE = constants.FETCHER_BATCH_SIZE
  , DELAY_BLOCK_COUNT = 10
;

let errInFetchingTxReceipt = null
;

/**
 * Constructor to create object of BlockFetcher
 *
 * @param {Integer} chainId - chainId of the block chain
 * @param {Boolean} singleFetchForVerifier verifier flag
 *
 * @constructor
 */
const BlockFetcher = function (chainId, singleFetchForVerifier) {
  this.web3Interact = Web3Interact.getInstance(chainId);
  this.chainId = chainId;
  this.singleFetchForVerifier = singleFetchForVerifier || false;
  this.state = {
    lastBlock: null
  };
};

/**
 * State of the fetcher with config details.
 * @type {Object}
 */
BlockFetcher.prototype.state = null;

BlockFetcher.prototype.cleanBlockArray = function (promiseResult, blockNumber) {
  const oThis = this;

  let blockArray = [];
  oThis.nextStartBlockNo = blockNumber;
  for (let i = 0; i < promiseResult.length; i++) {
    const result = promiseResult[i];
    if (result.isFailure()) {
      logger.log("BlockFetcher result for BlockNo-", oThis.nextStartBlockNo, "failed with result-", result);
      break;
    } else if (result.data.isProcessed) {
      oThis.nextStartBlockNo = oThis.nextStartBlockNo + 1;
    } else {
      oThis.blockNumbersArray.push(result.data.number);
      oThis.nextStartBlockNo = result.data.number + 1;
      blockArray.push(result.data);
    }
  }
  return blockArray;
};

BlockFetcher.prototype.isNextBlockBatchFetchable = async function (blockNumber, batchSize) {
  const oThis = this;
  // Wait For for few blocks before fetching it
  let highestBlockNumber = await oThis.web3Interact.isNodeConnected()
    .then(function () {
      return oThis.web3Interact.highestBlock().then(function(res){
        if (res.isFailure()){
          logger.notify('l_bu_bf_fub_1', 'error in web3Interact.highestBlock', res);
          return -1;
        }else{
          return res.data.block_number
        }
      })
    })
    .catch(function (err) {
      logger.notify('l_bu_bf_fub_2', 'error in getBlockNumber', err);
      return -1;
    });


  logger.log("fetchAndUpdateBlock :: highestBlockNumber", highestBlockNumber, (highestBlockNumber - (blockNumber + batchSize - 1) >= DELAY_BLOCK_COUNT));

  //Check is block fetch able
  return  (highestBlockNumber - (blockNumber + batchSize - 1) >= DELAY_BLOCK_COUNT);
};

/**
 * To get TransactionArray from Block Data Array
 * @param {Array} blockDataArray Block Data Array
 * @returns {*}
 */
BlockFetcher.prototype.getTransactionArray = function (blockDataArray) {
  if (blockDataArray === undefined || blockDataArray.length <= 0) {
    return Promise.resolve([]);
  }

  const oThis = this
    , transactionsArray = []
  ;

  for (let blockInd in blockDataArray) {
    const block = blockDataArray[blockInd];

    for (let txnInd in block.transactions) {
      const txn = {
        "hash" :  block.transactions[txnInd],
        "timestamp": block.timestamp
      };
      transactionsArray.push(txn);
    }
  }
  return transactionsArray;
};

/**
 * Method to fetch block using blockNumber
 * @param  {Integer} blockNumber Block Number
 * @return {null}
 */
BlockFetcher.prototype.fetchAndUpdateBlock = async function (blockNumber) {

  const oThis = this
    , promiseResult = []
  ;

  let expectedBatchSize = null
    , batchSize = null
    ;

  oThis.nextStartBlockNo = blockNumber;
  oThis.blockNumbersArray = [];

  errInFetchingTxReceipt = false;

  if (oThis.singleFetchForVerifier) {
    expectedBatchSize = 1;
  } else {
    expectedBatchSize = this.state.lastBlock ? this.state.lastBlock - blockNumber : MAX_BATCH_SIZE;
  }

  batchSize = Math.min(MAX_BATCH_SIZE, expectedBatchSize);

  logger.log('\n\n\n\n\n\n');
  logger.log('************* Fetch Block batchSize ***************', batchSize);
  logger.log('************* Fetch Block ***************', blockNumber);

  // check for undefined object
  if (blockNumber === undefined) {
    logger.log("In #fetchBlock undefined blockNumber ");
    return Promise.resolve(-1);
  }

  if (!await oThis.isNextBlockBatchFetchable(blockNumber, batchSize)) return oThis.nextStartBlockNo;

  //Get batch of next blocks
  for (let i = 0; i < batchSize; i++) {
    promiseResult.push(await oThis.getBlockPromise(blockNumber + i));
  }

  return Promise.resolve(promiseResult)
    .then(function (promiseResult) {
      return oThis.cleanBlockArray(promiseResult, blockNumber);
    })
    .then(function (blockArray) {
      return oThis.writeBlocksToDB(blockArray);
    })
    .then(function (blockArray) {
      return oThis.getTransactionArray(blockArray);
    })
    .then(function (transactionsArray) {
      return TransactionProcessor.newInstance(oThis.chainId).process(transactionsArray);
    })
    .then(function (isInsertSucceeded) {
      const blockObj = new BlockKlass(oThis.chainId);
      if (isInsertSucceeded) {

        if (errInFetchingTxReceipt){
          if(oThis.singleFetchForVerifier){
            logger.win("block_fetcher :: Marking blockNumbers as failed", isInsertSucceeded, oThis.blockNumbersArray, errInFetchingTxReceipt);
            return oThis.updateBlocksVerified(oThis.blockNumbersArray, blockObj.invertedVerified[blockConst.failed]);
          }else{
            logger.error("block_fetcher :: if blockNumbers are unverified", isInsertSucceeded, oThis.blockNumbersArray, errInFetchingTxReceipt);
            return false;
          }

        }else{
          logger.win("block_fetcher :: Marking blockNumbers as verified", isInsertSucceeded, oThis.blockNumbersArray, errInFetchingTxReceipt);
          return oThis.updateBlocksVerified(oThis.blockNumbersArray, blockObj.invertedVerified[blockConst.verified]);
        }

      }else {
        logger.error("block_fetcher :: else blockNumbers are unverified", isInsertSucceeded, oThis.blockNumbersArray, errInFetchingTxReceipt);
        return isInsertSucceeded;
      }

    })
    .then(function (i_d_k) {
      console.log("fetchAndUpdateBlock :: calling callback");
      return oThis.nextStartBlockNo;
    })
    .catch(function (err) {
      logger.notify('l_bu_bf_1', 'error in block fetcher', err);
      logger.error("BlockFetcher catch", err);
      return blockNumber;
    });
};


/**
 * Update Blocks to verified after completion of processing.
 *
 * @param  {Array} blockNumbersArray Block Numbers of rows to be updated
 * @param  {Integer} verifiedVal verified value
 * @return {Promise}
 */
BlockFetcher.prototype.updateBlocksVerified = function (blockNumbersArray, verifiedVal) {

  const oThis = this;

  if (blockNumbersArray.length < 1) {
    return Promise.resolve([]);
  }

  logger.log("Updating blocks to verified :: count- ", blockNumbersArray.length);

  return new Promise(function (resolve, reject) {

    const blockObj = new BlockKlass(oThis.chainId);

    blockObj.update({verified: verifiedVal}, {touch: false}).where({block_number: blockNumbersArray}).fire().then(
      function (res) {
        logger.log("Updating blocks into DB complete");
        resolve();
      }, reject);
  });
};

/**
 *
 * @param currBlockNo current Block Number to fetch
 * @returns {Promise<any>}
 */
BlockFetcher.prototype.getBlockPromise = function (currBlockNo) {

  const oThis = this;

  return new Promise(async function (onResolve, onReject) {

    const blockScannedStatus = await oThis.isBlockInserted(currBlockNo);
    logger.log("Block No-", currBlockNo, " isBlockInserted-", blockScannedStatus);
    if (blockScannedStatus) return onResolve(responseHelper.successWithData({isProcessed: true}));

    oThis.web3Interact.isNodeConnected()
      .then(function () {
        oThis.web3Interact.getBlock( currBlockNo )
          .then(onResolve);
      })
      .catch(function (err) {
        logger.notify("l_bu_bf_gbp_1", "getBlockPromise error", err);
        return onResolve(responseHelper.error('l_bu_bf_gbp_1', err));
      });
  });
};


/**
 * Write Block Json Data object into the provided DB.
 *
 * @param  {Array} blockDataArray Block Data Array
 *
 * @return {Promise}
 */
BlockFetcher.prototype.writeBlocksToDB = function (blockDataArray) {

  const oThis = this;

  if (blockDataArray.length < 1) {
    return Promise.resolve([]);
  }

  logger.log("Inserting blocks into DB : ",blockDataArray.length);

  return new Promise(function (resolve, reject) {
    const formattedBlockDataArray = [];
    try {
      blockDataArray.forEach(function (blockData) {
        const formattedBlockData = oThis.formatBlockData(blockData, oThis.chainId);
        //logger.info("Formatted Block data", formattedBlockData);
        formattedBlockDataArray.push(formattedBlockData);
      });

      const blockObj = new BlockKlass(oThis.chainId);

      blockObj.insertMultiple(BlockKlass.DATA_SEQUENCE_ARRAY, formattedBlockDataArray)
        .onDuplicate('block_number=block_number').fire()
        .then(function (res) {
          logger.log("Inserting blocks into DB complete");
          resolve(blockDataArray);
        })
        .catch(function(err){
          logger.error("block_fetcher :: writeBlocksToDB :: insertMultiple :: ", err);
          reject(err);
        })

    } catch (err) {
      logger.error("block_fetcher :: writeBlocksToDB :: try catch :: ", err);
      reject(err);
    }
  });

};

/**
 * Format block data as per the data sequence of insertion into DB.
 *
 * @param  {Object} rawBlockData Block Data Json Object*
 * @param  {Integer} chainId Chain Id
 * @return {Array}
 */
BlockFetcher.prototype.formatBlockData = function (rawBlockData, chainId) {
  const oThis = this
    , db_config = core_config.getChainDbConfig(chainId)
    , blockObj = new BlockKlass(oThis.chainId)
    ;

  const block_attributes = db_config.blockAttributes;

  const formattedBlockData = [];
  formattedBlockData.push(rawBlockData.number);
  formattedBlockData.push(rawBlockData.hash);
  formattedBlockData.push(rawBlockData.parentHash);
  formattedBlockData.push(rawBlockData.difficulty);
  formattedBlockData.push(rawBlockData.totalDifficulty);
  formattedBlockData.push(rawBlockData.gasLimit);
  formattedBlockData.push(rawBlockData.gasUsed);
  formattedBlockData.push(rawBlockData.transactions.length);
  formattedBlockData.push(rawBlockData.timestamp);
  formattedBlockData.push(blockObj.invertedVerified[blockConst.unverified]);
  formattedBlockData.push(blockObj.invertedStatuses[blockConst.pendingStatus]);

  return formattedBlockData;
};



/**
 * To check whether the block is inserted or not
 * @param blockNumber
 * @returns {Promise<any>}
 */
BlockFetcher.prototype.isBlockInserted = async function (blockNumber) {
  const oThis = this;

  try {
    const result = await new BlockKlass(oThis.chainId).select('COUNT(id)').where(['block_number=?', blockNumber]).fire();
    if (result[0] && result[0]['COUNT(id)'] === '1' ) {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  } catch (err) {
    logger.error("block_fetcher :: isBlockInserted :: catch error ", err);
    return Promise.resolve(false);
  }
};

module.exports = {
  newInstance: function (chainId, singleFetchForVerifier) {
    return new BlockFetcher(chainId, singleFetchForVerifier);
  }
};