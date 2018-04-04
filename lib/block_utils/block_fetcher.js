"use strict";
/**
 * Fetch blocks from chain and feed them into the provided DB.
 *
 * @module lib/block_utils/block_fetcher
 */
const rootPrefix = "../.."
  , logger = require(rootPrefix + "/helpers/custom_console_logger")
  , constants = require(rootPrefix + "/config/core_constants")
  , config = require(rootPrefix + "/config")
  , BlockKlass = require(rootPrefix + "/app/models/block")
  , blockConst = require(rootPrefix + '/lib/global_constant/block')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , Web3Interact = require(rootPrefix + "/lib/web3/interact/rpc_interact")
  , TransactionProcessor = require(rootPrefix + "/lib/block_utils/transaction_processor")
;

const MAX_BATCH_SIZE = constants.FETCHER_BATCH_SIZE
  , DELAY_BLOCK_COUNT = constants.DELAY_BLOCK_COUNT
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
    } else {
      oThis.blockNumbersArray.push(result.data.number);
      oThis.nextStartBlockNo = result.data.number + 1;
      blockArray.push(result.data);
    }
  }
  return blockArray;
};

BlockFetcher.prototype.filterFetchableBlocks = async function (blockNumber, batchSize) {
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

  // Example :- 4 =((100-6) - 90)
  // batchSize = min(batchSize, 4)
  let blockDiff = (highestBlockNumber - DELAY_BLOCK_COUNT + 1) - blockNumber;

  if (blockDiff < 1){
    return [];
  }

  batchSize = Math.min(batchSize, blockDiff);

  const blockHashes = {};
  for (let blockNo = blockNumber; blockNo< blockNumber + batchSize; blockNo++ ) {
    blockHashes[blockNo] = true;
  }

  let blockArray = Object.keys(blockHashes);
  let response = await new BlockKlass(oThis.chainId).select('block_number').where({block_number: blockArray}).fire();
  for (let i = 0;i<response.length;i++){
    blockHashes[response[i].block_number] = false;
  }

  blockArray = [];
  for (let blockNum in blockHashes) {
    if (blockHashes[blockNum]) {
      blockArray.push(blockNum);
    }
  }

  logger.log("fetchAndUpdateBlock :: highestBlockNumber and blockArray", highestBlockNumber, blockArray);

  return  blockArray;
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

  let blockNumberArray =(await oThis.filterFetchableBlocks(blockNumber, batchSize));

  if (blockNumberArray.length <= 0) return oThis.nextStartBlockNo;

  //Get batch of next blocks
  for (let i = 0; i < blockNumberArray.length; i++) {
    promiseResult.push(await oThis.getBlockPromise(blockNumberArray[i]));
  }

  return Promise.resolve(promiseResult)
    .then(function (promiseResult) {
      return oThis.cleanBlockArray(promiseResult, blockNumber);
    })
    .then(function ( blockArray ) {
      return oThis.writeBlocksToDB(blockArray);
    })
    .then(function ( blockArray ) {
      return oThis.getTransactionArray(blockArray);
    })
    .then(function (transactionsArray) {
      logger.log('DEBUG..', transactionsArray);
      return TransactionProcessor.newInstance(oThis.chainId).process(transactionsArray);
    })
    .then(function (response) {
      const blockObj = new BlockKlass(oThis.chainId);
      if (response.isSuccess()) {
        if (response.data.errInFetchingTxReceipt){
          if(oThis.singleFetchForVerifier){
            logger.win("block_fetcher :: Marking blockNumbers as failed", response.isSuccess(), oThis.blockNumbersArray, response.data.errInFetchingTxReceipt);
            return oThis.updateBlocksStatus(oThis.blockNumbersArray, blockObj.invertedVerified[blockConst.unverified] ,blockObj.invertedStatuses[blockConst.failedStatus]);
          }else{
            logger.error("block_fetcher :: Marking blockNumbers as unverified", response.isSuccess(), oThis.blockNumbersArray, response.data.errInFetchingTxReceipt);
            return false;
          }

        }else{
          logger.win("block_fetcher :: Marking blockNumbers as verified", response.isSuccess(), oThis.blockNumbersArray, response.data.errInFetchingTxReceipt);
          return oThis.updateBlocksStatus(oThis.blockNumbersArray, blockObj.invertedVerified[blockConst.verified] ,blockObj.invertedStatuses[blockConst.completeStatus]);
        }

      }else {
        logger.error("block_fetcher :: else blockNumbers are unverified", response.isSuccess(), oThis.blockNumbersArray, response.data.errInFetchingTxReceipt);
        if(oThis.singleFetchForVerifier) {
          return oThis.updateBlocksStatus(oThis.blockNumbersArray, blockObj.invertedVerified[blockConst.unverified], blockObj.invertedStatuses[blockConst.failedStatus]);
        } else {
          return response.isSuccess();
        }
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
 * @param  {Integer} statusVal status value
 * @return {Promise}
 */
BlockFetcher.prototype.updateBlocksStatus = function (blockNumbersArray, verifiedVal, statusVal) {

  const oThis = this;

  if (blockNumbersArray.length < 1) {
    return Promise.resolve([]);
  }

  logger.log("Updating blocks to verified :: count- ", blockNumbersArray.length);

  return new Promise(function (resolve, reject) {

    const blockObj = new BlockKlass(oThis.chainId);

    blockObj.update({verified: verifiedVal, status: statusVal}).where({block_number: blockNumbersArray}).fire().then(
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

  return new Promise(async function (onResolve) {
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
    , db_config = config.getChainDbConfig(chainId)
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

module.exports = {
  newInstance: function (chainId, singleFetchForVerifier) {
    return new BlockFetcher(chainId, singleFetchForVerifier);
  }
};