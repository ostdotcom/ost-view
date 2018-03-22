"use strict";
/**
 * Fetch blocks from chain and feed them into the provided DB.
 *
 * @module lib/block_utils/block_fetcher
 */
const rootPrefix = "../.."
  , logger = require(rootPrefix + "/helpers/custom_console_logger")
  , erctoken = require(rootPrefix + "/lib/contract_interact/contractDecoder")
  , constants = require(rootPrefix + "/config/core_constants")
  , core_config = require(rootPrefix + "/config")
  , TokenUnits = require(rootPrefix + "/helpers/tokenUnits")
  , BlockKlass = require(rootPrefix + "/app/models/block")
  , blockConst = require(rootPrefix + '/lib/global_constant/block')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

const MAX_BATCH_SIZE = constants.FETCHER_BATCH_SIZE
  , TX_INSERT_BATCH_SIZE = 40
  , DELAY_BLOCK_COUNT = 10
;

var errInFetchingTxReceipt = null
;

/**
 * Constructor to create object of BlockFetcher
 *
 * @param {web3Interact} web3Interact Web3RPC Object
 * @param {Object} dbInteract DB object to interact
 * @param {Integer} chainId - chainId of the block chain
 * @param {Boolean} singleFetchForVerifier verifier flag
 *
 * @constructor
 */
const BlockFetcher = function (web3Interact, dbInteract, chainId, singleFetchForVerifier) {
  this.web3Interact = web3Interact;
  this.dbInteract = dbInteract;
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

/**
 * Method to fetch block using blockNumber
 *
 * @param  {Integer} blockNumber Block Number
 * @param  {FunctionCallback} insertionCompleteCallback Insertion Complete Callback
 *
 * @return {null}
 */
BlockFetcher.prototype.fetchAndUpdateBlock = async function (blockNumber, insertionCompleteCallback) {

  const oThis = this
    , promiseResult = []
  ;

  var expectedBatchSize = null
    , batchSize = null
    , nextStartBlockNo = blockNumber
  ;

errInFetchingTxReceipt = false;

  if (this.singleFetchForVerifier == true) {
    expectedBatchSize = 1;
  } else {
    expectedBatchSize = this.state.lastBlock ? this.state.lastBlock - blockNumber : MAX_BATCH_SIZE;
  }

  batchSize = Math.min(MAX_BATCH_SIZE, expectedBatchSize);

  logger.log('\n\n\n\n\n\n');
  logger.log('************* Fetch Block batchSize ***************', batchSize);
  logger.log('************* Fetch Block ***************', blockNumber);

  oThis.callback = insertionCompleteCallback;

  // check for undefined object
  if (blockNumber == undefined) {
    logger.log("In #fetchBlock undefined blockNumber ");
    return;
  }

  // Wait For for few blocks before fetching it
  var highestBlockNumber = await oThis.web3Interact.isNodeConnected()
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



  logger.log("fetchAndUpdateBlock :: highestBlockNumber", highestBlockNumber);

  if (highestBlockNumber - (blockNumber + batchSize - 1) < DELAY_BLOCK_COUNT) {
    if (oThis.callback) {
      return oThis.callback(blockNumber);
    } else {
      return;
    }
  }

  for (var i = 0; i < batchSize; i++) {
    promiseResult.push(await oThis.getBlockPromise(blockNumber + i));
  }

  const blockNumbersArray = [];
  Promise.resolve(promiseResult)
    .then(function (promiseResult) {
      var blockArray = [];
      nextStartBlockNo = blockNumber;
      for (var i = 0; i < promiseResult.length; i++) {
        const result = promiseResult[i];
        if (result.isFailure()) {
          logger.log("BlockFetcher result for BlockNo-", nextStartBlockNo, "failed with result-", result);
          break;
        } else if (result.data.isProcessed) {
          nextStartBlockNo = nextStartBlockNo + 1;
        } else {
          blockNumbersArray.push(result.data.number);
          nextStartBlockNo = result.data.number + 1;
          blockArray.push(result.data);
        }
      }
      return blockArray;

    })
    .then(function (blockArray) {
      return oThis.writeBlocksToDB(blockArray);
    })
    .then(function (blockArray) {
      return oThis.writeTransactionsToDB(blockArray)
    })
    .then(function (isInsertSuccessed) {
      const blockObj = new BlockKlass();
      if (isInsertSuccessed) {

        if (errInFetchingTxReceipt){
          if(oThis.singleFetchForVerifier){
            logger.win("block_fetcher :: Marking blockNumbers as failed", isInsertSuccessed, blockNumbersArray, errInFetchingTxReceipt);
            return oThis.updateBlocksVerified(blockNumbersArray, blockObj.invertedVerified[blockConst.failed]);
          }else{
            logger.error("block_fetcher :: if blockNumbers are unverified", isInsertSuccessed, blockNumbersArray, errInFetchingTxReceipt);
            return false;
          }

        }else{
          logger.win("block_fetcher :: Marking blockNumbers as verified", isInsertSuccessed, blockNumbersArray, errInFetchingTxReceipt);
          return oThis.updateBlocksVerified(blockNumbersArray, blockObj.invertedVerified[blockConst.verified]);
        }

      }else {
        logger.error("block_fetcher :: else blockNumbers are unverified", isInsertSuccessed, blockNumbersArray, errInFetchingTxReceipt);
        return isInsertSuccessed;
      }

    })
    .then(function (i_d_k) {
      if (oThis.callback) {
        console.log("fetchAndUpdateBlock :: calling callback");
        setTimeout(function () {
          oThis.callback(nextStartBlockNo);
        }, 100);
      } else {
        console.log("fetchAndUpdateBlock :: callback NOT DEFINED!");
      }
      return i_d_k;
    })
    .catch(function (err) {
      logger.notify('l_bu_bf_1', 'error in block fetcher', err);
      if (oThis.callback) {
        logger.error("BlockFetcher catch", err);
        return oThis.callback(nextStartBlockNo);
      }
    });
};


/**
 * Update Blocks to verified after completion of processing.
 *
 * @param  {Array} blockNumbersArray Block Numbers of rows to be updated
 *
 * @return {Promise}
 */
BlockFetcher.prototype.updateBlocksVerified = function (blockNumbersArray, verifiedVal) {

  var oThis = this;

  if (blockNumbersArray.length < 1) {
    return Promise.resolve([]);
  }

  logger.log("Updating blocks to verified :: count- ", blockNumbersArray.length);

  return new Promise(function (resolve, reject) {

    const blockObj = new BlockKlass();

    blockObj.update({verified: verifiedVal}, {touch: false}).where({block_number: blockNumbersArray}).fire().then(
      function (res) {
        logger.log("Updating blocks into DB complete");
        resolve();
      }, reject);
  });
};


BlockFetcher.prototype.getBlockPromise = function (currBlockNo) {

  const oThis = this;

  return new Promise(async function (onResolve, onReject) {

    const blockScannedStatus = await oThis.dbInteract.isBlockInserted(currBlockNo);
    logger.log("Block No-", currBlockNo, " isBlockInserted-", blockScannedStatus);
    if (blockScannedStatus) return onResolve(responseHelper.successWithData({isProcessed: true}));

    oThis.web3Interact.isNodeConnected()
      .then(function () {
        oThis.web3Interact.getBlock(currBlockNo, true)
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

  var oThis = this;

  if (blockDataArray.length < 1) {
    return Promise.resolve([]);
  }

  logger.log("Inserting blocks into DB : ",blockDataArray.length);

  return new Promise(function (resolve, reject) {
    var formattedBlockDataArray = [];
    blockDataArray.forEach(function (blockData) {
      var formattedBlockData = oThis.formatBlockData(blockData, oThis.chainId);
      //logger.info("Formatted Block data", formattedBlockData);
      formattedBlockDataArray.push(formattedBlockData);
    });

    const blockObj = new BlockKlass();

    blockObj.insertMultiple(constants.BLOCKS_DATA_SEQUENCE_ARRAY, formattedBlockDataArray, {touch: false})
      .onDuplicate('block_number=block_number').fire().then(
      function (res) {
        logger.log("Inserting blocks into DB complete");
        resolve(blockDataArray);
      }, reject);
  });

};

/**
 * Format block data as per the data sequence of insertion into DB.
 *
 * @param  {Object} rawBlockData Block Data Json Object*
 * @return {Array}
 */
BlockFetcher.prototype.formatBlockData = function (rawBlockData, chainId) {

  const db_config = core_config.getChainDbConfig(chainId);
  const block_attributes = db_config.blockAttributes;

  var formattedBlockData = [];
  formattedBlockData.push(rawBlockData.number);
  formattedBlockData.push(rawBlockData.hash);
  formattedBlockData.push(rawBlockData.parentHash);
  formattedBlockData.push(rawBlockData.miner);
  formattedBlockData.push(rawBlockData.difficulty);
  formattedBlockData.push(rawBlockData.totalDifficulty);
  formattedBlockData.push(rawBlockData.gasLimit);
  formattedBlockData.push(rawBlockData.gasUsed);
  formattedBlockData.push(rawBlockData.transactions.length);
  formattedBlockData.push(rawBlockData.timestamp);
  formattedBlockData.push(false);

  //optional
  formattedBlockData.push(block_attributes.indexOf("nonce") > -1 ? rawBlockData.nonce : null);
  formattedBlockData.push(block_attributes.indexOf("sha3Uncles") > -1 ? rawBlockData.sha3Uncles : null);
  formattedBlockData.push(block_attributes.indexOf("uncles") > -1 ? rawBlockData.uncles : null);
  formattedBlockData.push(block_attributes.indexOf("logsBloom") > -1 ? rawBlockData.logsBloom : null);
  formattedBlockData.push(block_attributes.indexOf("transactionsRoot") > -1 ? rawBlockData.transactionsRoot : null);
  formattedBlockData.push(block_attributes.indexOf("transactions") > -1 ? rawBlockData.transactions : null);
  formattedBlockData.push(block_attributes.indexOf("stateRoot") > -1 ? rawBlockData.stateRoot : null);
  formattedBlockData.push(block_attributes.indexOf("receiptRoot") > -1 ? rawBlockData.receiptRoot : null);
  formattedBlockData.push(block_attributes.indexOf("size") > -1 ? rawBlockData.size : null);
  formattedBlockData.push(block_attributes.indexOf("extraData") > -1 ? rawBlockData.extraData : null);
  formattedBlockData.push(block_attributes.indexOf("mixHash") > -1 ? rawBlockData.mixHash : null);
  return formattedBlockData;
};

/**
 * Format transaction data as per the data sequence of insertion into DB.
 *
 * @param  {Object} transactionRes Array of Transaction Data Json Object
 * @param  {Object} receiptRes Array of Transaction Receipt Json Object
 * @param  {Integer}    timestamp timestamp of the block
 *
 * @return {Array}
 */
BlockFetcher.prototype.formatTransactionsArray = function (transactionRes, receiptRes, chainId) {

  const db_config = core_config.getChainDbConfig(chainId);
  const txn_attributes = db_config.txnAttributes;

  var insertionArray = []
    , resInd = 0
    , len = transactionRes.length
  ;
  for (resInd = 0; resInd < len; resInd++) {
    var txn = transactionRes[resInd];
    var rtxn = receiptRes[resInd];

    var txnArray = [];

    txnArray.push(txn.hash);
    txnArray.push(txn.blockNumber);
    txnArray.push(txn.transactionIndex);
    txnArray.push(rtxn.contractAddress);
    txnArray.push(txn.from);
    txnArray.push(txn.to);
    txnArray.push(txn.value);
    txnArray.push(rtxn.gasUsed);
    txnArray.push(txn.gasPrice);
    txnArray.push(txn.nonce);
    txnArray.push(txn.input);
    txnArray.push(JSON.stringify(rtxn.logs));
    txnArray.push(txn.timestamp);

    //Optionals
    txnArray.push(txn_attributes.indexOf("status") > -1 ? rtxn.status : null);
    txnArray.push(txn_attributes.indexOf("logsBloom") > -1 ? rtxn.logsBloom : null);
    txnArray.push(txn_attributes.indexOf("r") > -1 ? txn.r : null);
    txnArray.push(txn_attributes.indexOf("s") > -1 ? txn.s : null);
    txnArray.push(txn_attributes.indexOf("v") > -1 ? txn.v : null);

    insertionArray.push(txnArray);
  }
  return insertionArray;
};


/**
 * Format transaction data as per the data sequence of insertion into DB.
 *
 * @param  {Object} txn Transaction Data Json Object
 * @param  {Object} rtxn Transaction Receipt Json Object
 * @param  {Integer}    chainId ChainId
 *
 * @return {Array}
 */
BlockFetcher.prototype.formatTransactionData = function (txn, rtxn, chainId) {

  const db_config = core_config.getChainDbConfig(chainId);
  const txn_attributes = db_config.txnAttributes;


  var txnArray = [];

  txnArray.push(txn.hash);
  txnArray.push(txn.blockNumber);
  txnArray.push(txn.transactionIndex);
  txnArray.push(rtxn.contractAddress);
  txnArray.push(txn.from);
  txnArray.push(txn.to);
  txnArray.push(txn.value);
  txnArray.push(rtxn.gasUsed);
  txnArray.push(txn.gasPrice);
  txnArray.push(txn.nonce);
  txnArray.push(txn.input);
  txnArray.push(JSON.stringify(rtxn.logs));
  txnArray.push(txn.timestamp);

  //Optionals
  txnArray.push(txn_attributes.indexOf("status") > -1 ? rtxn.status : null);
  txnArray.push(txn_attributes.indexOf("logsBloom") > -1 ? rtxn.logsBloom : null);
  txnArray.push(txn_attributes.indexOf("r") > -1 ? txn.r : null);
  txnArray.push(txn_attributes.indexOf("s") > -1 ? txn.s : null);
  txnArray.push(txn_attributes.indexOf("v") > -1 ? txn.v : null);

  return txnArray;
};

/**
 * Format tokenTransaction data as per the data sequence of insertion into DB.
 *
 * @param  {Object} transaction Transaction JSON object
 * @param  {Array} decodedContTransactionList Decoded Contract Transactions List
 *
 * @return {Array}
 */
BlockFetcher.prototype.formatTokenTransactionData = function (transaction, decodedContTransactionList) {
  var formatedContractTxnList = [];

  for (var ind in decodedContTransactionList) {
    var decodedContTransaction = decodedContTransactionList[ind];
    var formatedContractTxn = [];
    formatedContractTxn.push(transaction[constants['TRANSACTION_INDEX_MAP']['transaction_hash']]);
    formatedContractTxn.push(decodedContTransaction.address);
    formatedContractTxn.push(decodedContTransaction._from);
    formatedContractTxn.push(decodedContTransaction._to);
    formatedContractTxn.push(decodedContTransaction._value);
    formatedContractTxn.push(transaction[constants['TRANSACTION_INDEX_MAP']['timestamp']]);
    formatedContractTxn.push(transaction[constants['TRANSACTION_INDEX_MAP']['block_number']]);

    formatedContractTxnList.push(formatedContractTxn);
  }

  return formatedContractTxnList;
};

/**
 * To write transactions data into the DB provided from the blockData
 *
 * @param  {Object} blockDataArray Block Data Json Object
 *
 * @return {Promise}
 */
BlockFetcher.prototype.writeTransactionsToDB = async function (blockDataArray) {
  if (blockDataArray == undefined || blockDataArray.length <= 0) {
    return Promise.resolve(false);
  }

  const oThis = this
    , transactionsArray = []
    , batchSize = TX_INSERT_BATCH_SIZE
  ;

  var insertionTransactionPromises = []
  ;

  for (var blockInd in blockDataArray) {
    const block = blockDataArray[blockInd];

    for (var txnInd in block.transactions) {
      const txn = block.transactions[txnInd];
      txn.timestamp = block.timestamp;
      transactionsArray.push(txn);
    }
  }

  if (transactionsArray.length <= 0) {
    return Promise.resolve(true);
  }

  var batchNo = 1;

  while (true) {
    const offset = (batchNo - 1) * batchSize
      , batchedData = transactionsArray.slice(offset, offset + batchSize)
      , batchLen = batchedData.length
    ;

    var txReceiptPromises = []
      , rPromise
    ;

    if (batchLen === 0) break;

    batchNo = batchNo + 1;

    for (var i = 0; i < batchLen; i++) {
      //RACHIN : Promise needs to be handled here.
      //rPromise -> Receipt Promise.
      var tx = batchedData[i];
      rPromise = oThis.createReceiptPromise(tx);
      txReceiptPromises.push(rPromise);
    }

    var transactionArray
      , txInsertPromise
    ;

    //Wait for receipts to come.
    transactionArray = await Promise.all(txReceiptPromises);

    transactionArray = oThis.cleanTransactionArray(transactionArray);

    //Ok, now we have max upto 100 transactions. Lets start the DB Operations
    txInsertPromise = oThis.createTxInsertPromise(transactionArray);
    insertionTransactionPromises.push(txInsertPromise);
  }

  var isInsertSuccessed = true;
  //await Promise.all( insertionTransactionPromises , function () {
  //  logger.win("block_fetcher :: writeTransactionsToDB :: insertionTransaction completed.");
  //});

  return Promise.all(insertionTransactionPromises)
    .then(function (isSuccessedArray) {
      for (var i = 0; i < isSuccessedArray.length; i++) {
        var isSuccessed = isSuccessedArray[i];
        isInsertSuccessed = isInsertSuccessed && isSuccessed;
      }
      return isInsertSuccessed;
    })
    .catch(function () {
      isInsertSuccessed = false;
      return isInsertSuccessed;
    });

};


BlockFetcher.prototype.createReceiptPromise = function (transaction) {
  const oThis = this
    , txHash = transaction.hash
  ;

  return oThis.web3Interact.getReceipt(txHash)
    .then(function (txReceipt) {
      logger.log("got txReceipt for", txHash);
      var txData = oThis.formatTransactionData(transaction, txReceipt, oThis.chainId);
      return txData;
    })
    .catch(function (reason) {
      //DID NOT GET RECEIPT. RACHIN: @Kedar: What needs to be done here?
      // Currently, we will silently skip it.
      errInFetchingTxReceipt = true;

      logger.error("******************** did not get txReceipt for", txHash);
      logger.error("reason", reason);
      return null;
    });
};

BlockFetcher.prototype.cleanTransactionArray = function (transactionArray) {
  const oThis = this;

  var cleanedUpArray = []
    , len = transactionArray.length
    , txData
    , cnt
  ;

  for (cnt = 0; cnt < len; cnt++) {
    txData = transactionArray[cnt];
    if (txData) {
      cleanedUpArray.push(txData);
    }
  }

  return cleanedUpArray;
};

BlockFetcher.prototype.createTxInsertPromise = function (transactionArray) {
  const oThis = this;


  //i_d_c -> I Dont Care.
  var shouldContinue = true
    , noOfTx = transactionArray.length
    , orgTs = Date.now()
    , prevTs = orgTs
    , newTs
  ;
  logger.log("block_fetcher :: writeTransactionsToDB :: createTxInsertPromise :: calling insertTransaction");
  return oThis.dbInteract.insertTransaction(transactionArray)
    .catch(function (reason) {
      logger.error("block_fetcher :: writeTransactionsToDB :: createTxInsertPromise :: insertTransaction rejected the promise.");
      logger.error("reason", reason);
      shouldContinue = false;
      return transactionArray;
    })
    .then(function (i_d_c) {
      if (shouldContinue) {
        //Log Times
        newTs = Date.now();
        logger.info("block_fetcher :: insertTransaction :: took ", (newTs - prevTs), " miliSeconds", "noOfTx", noOfTx);
        prevTs = newTs;

        logger.log("block_fetcher :: writeTransactionsToDB :: createTxInsertPromise :: calling writeTokenTransactionToDB");
        return oThis.writeTokenTransactionToDB(transactionArray)

      } else {
        logger.info("block_fetcher :: writeTransactionsToDB :: createTxInsertPromise :: writeTokenTransactionToDB has been skipped");
        return transactionArray;
      }
    })
    .catch(function (reason) {
      logger.error("block_fetcher :: writeTransactionsToDB :: createTxInsertPromise :: writeTokenTransactionToDB rejected the promise.");
      logger.error("reason", reason);
      shouldContinue = false;
      return transactionArray;
    })
    .then(function (i_d_c) {
      if (shouldContinue) {
        //Log Times
        newTs = Date.now();
        logger.info("block_fetcher :: writeTokenTransactionToDB :: took ", (newTs - prevTs), " miliSeconds", "noOfTx", noOfTx);
        prevTs = newTs;

        logger.log("block_fetcher :: writeTransactionsToDB :: createTxInsertPromise :: calling handleTransactionLogEvents");
        return oThis.handleTransactionLogEvents(transactionArray);
      } else {
        logger.info("block_fetcher :: writeTransactionsToDB :: createTxInsertPromise :: handleTransactionLogEvents has been skipped");
        return transactionArray;
      }
    })
    .catch(function (reason) {
      logger.error("block_fetcher :: writeTransactionsToDB :: createTxInsertPromise :: handleTransactionLogEvents rejected the promise.");
      logger.error("reason", reason);
      shouldContinue = false;
      return transactionArray;
    })
    .then(function (i_d_c) {
      //THIS IS FOR THE LAST THEN BLOCK TO LOG TIME,
      newTs = Date.now();
      if (shouldContinue) {
        //Log Times
        logger.info("block_fetcher :: handleTransactionLogEvents :: took ", (newTs - prevTs), " miliSeconds", "noOfTx", noOfTx);
        prevTs = newTs;
      }

      logger.info("block_fetcher :: createTxInsertPromise :: Promise took", (newTs - orgTs), " miliSeconds", "noOfTx", noOfTx);

      return shouldContinue;
    })
    ;
}

/**
 * To write Token Transactions in to DB from the transaction Array.
 *
 * @param  {Array} transactionArray Array of transactions
 *
 * @return {Promise}
 */
BlockFetcher.prototype.writeTokenTransactionToDB = function (transactionArray) {

  var oThis = this;

  if (transactionArray.length < 1) {
    return Promise.resolve(transactionArray);
  }


  var decodedTxnArray = [];
  logger.log("writeTokenTransactionToDB :: decodeTransactionsFromLogs length :",transactionArray.length);
  for (var txnIndex in transactionArray) {
    var transaction = transactionArray[txnIndex];
    var decodedContTransaction = erctoken.decodeTransactionsFromLogs(JSON.parse(transaction[constants['TRANSACTION_INDEX_MAP']['logs']]));
    var decodedTxn = oThis.formatTokenTransactionData(transaction, decodedContTransaction);
    for (var index in decodedTxn) {
      decodedTxnArray.push(decodedTxn[index]);
    }
  }

  if (decodedTxnArray.length <= 0) {
    return Promise.resolve(transactionArray);
  }

  logger.info("Total internal transactions ", decodedTxnArray.length);
  //logger.debug(decodedTxnArray);

  return oThis.dbInteract.insertTokenTransaction(decodedTxnArray)
    .then(function (res) {
      return transactionArray;
    })
    ;

};

/**
 * To Handle relevant log events of transactions
 * @param {Array} transactions - Transactions
 */
BlockFetcher.prototype.handleTransactionLogEvents = function (transactionArray) {
  var oThis = this;
  var promiseArray = [];
  console.log("decodeLogs for transactionArray : ", transactionArray.length);
  transactionArray.forEach(function (transaction) {
    var logs = JSON.parse(transaction[constants['TRANSACTION_INDEX_MAP']['logs']]);
    var eventArray = erctoken.decodeLogs(logs);

    eventArray.forEach(function (event) {
      logger.info("block_fetcher :: handleTransactionLogEvents :: RegisteredBrandedToken :: event.eventName :: ", event.eventName);

      switch (event.eventName) {
        case 'RegisteredBrandedToken':
          //Format data for insertion
          logger.info("block_fetcher :: handleTransactionLogEvents :: RegisteredBrandedToken");
          var result = oThis.dbInteract.getCoinFromContractAddress(event._token.toLowerCase())
            .then(function (isPresent) {
               if(!isPresent) {
                 return oThis.dbInteract.numberOfRowsInBrandedTokenTable();
               }
               return Promise.reject(event._token.toLowerCase() + " bt address already present");
            })
            .then(function (noOfRows) {
              if (noOfRows <= 0) {
                noOfRows = 1;
                oThis.dbInteract.initBrandedTokenTable();
              }
              return Promise.resolve(noOfRows);
            })
            .then(function (noOfRows) {
                var dataRow = [];
                dataRow.push(noOfRows);
                dataRow.push(event._name);
                dataRow.push(event._token.toLowerCase());
                dataRow.push(event._symbol);
                dataRow.push(event._uuid);
                dataRow.push(
                  (TokenUnits.toBigNumber(event._conversionRate))
                    .div(TokenUnits.convertToBigNumber(10).toPower(event._conversionRateDecimals)).toString(10));
                dataRow.push(0);
                dataRow.push(0);
                dataRow.push(0);
                dataRow.push(0);
                dataRow.push(null);
                dataRow.push(null);
                dataRow.push(null);
                dataRow.push(null);
                dataRow.push(null);
                dataRow.push(0);
                dataRow.push(0);
                dataRow.push(transaction[constants['TRANSACTION_INDEX_MAP']['timestamp']]);
                dataRow.push(null);
                return oThis.dbInteract.insertOrUpdateCompanyDataArray([dataRow]);
            })
            .catch(function (err){
              var logString = "RegisteredBrandedToken :: " + err;
              logger.log(logString);
              return Promise.resolve(logString);
            });
          promiseArray.push(result);
          break;
        default:
          break;
      }
    });
  });
  return Promise.all(promiseArray);
};

module.exports = {
  newInstance: function (web3Interact, dbInteract, chainId, singleFetchForVerifier) {
    return new BlockFetcher(web3Interact, dbInteract, chainId, singleFetchForVerifier);
  }
};