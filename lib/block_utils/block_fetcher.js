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
  ;

const MAX_BATCH_SIZE = 40;

/**
 * Constructor to create object of BlockFetcher
 *
 * @param {web3Interact} web3Interact Web3RPC Object
 * @param {Object} dbInteract DB object to interact
 * @param {Integer} chainId - chainId of the block chain
 * @param {Boolean} singleFetch verifier flag
 *
 * @constructor
 */
const BlockFetcher = function (web3Interact, dbInteract, chainId, singleFetch) {
  this.web3Interact = web3Interact;
  this.dbInteract = dbInteract;
  this.chainId = chainId;
  this.singleFetch = singleFetch;
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
BlockFetcher.prototype.fetchAndUpdateBlock = function (blockNumber, insertionCompleteCallback) {

  var oThis = this
    , promiseArray = []
    , expectedBatchSize = null
    , batchSize = null
    , nextStartBlockNo = blockNumber
    ;

  if (this.singleFetch == true){
    expectedBatchSize = 1;
  }else{
    expectedBatchSize = this.state.lastBlock ? this.state.lastBlock - blockNumber : MAX_BATCH_SIZE;
  }

  batchSize = Math.min(MAX_BATCH_SIZE, expectedBatchSize);

  logger.log('************* Fetch Block ***************', blockNumber);
  console.log("Determined batchSize", batchSize, "expectedBatchSize");
  oThis.callback = insertionCompleteCallback;

  // check for undefined object
  if (blockNumber == undefined) {
    logger.log("In #fetchBlock undefined blockNumber ");
    return;
  }

  for (var i = 0; i < batchSize; i++) {
    var currBlockNo = blockNumber + i;
    promiseArray.push(oThis.getBlockPromise(currBlockNo));
  }

  Promise.all(promiseArray)
    .then(function (promiseResult) {
      var blockArray = [];
      nextStartBlockNo = blockNumber;
      for (var i = 0; i < promiseResult.length; i++) {
        if (!promiseResult[i]) {
          console.log("BlockFetcher.prototype.fetchAndUpdateBlock--promiseResult[i]->");
          break;
        } else if (promiseResult[i].isProcessed) {
          // Do nothing
        } else {
          nextStartBlockNo = promiseResult[i].number + 1;
          blockArray.push(promiseResult[i]);
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
    .then(function (transactionArray) {
      return oThis.writeTokenTransactionToDB(transactionArray)
    })
    .then(function (transactionArray) {
      return oThis.handleTransactionLogEvents(transactionArray);
    })
    .then(function () {
      if (oThis.callback) {
        return oThis.callback(nextStartBlockNo);
      }
    })
    .catch(function (err) {
      if (oThis.callback) {
        console.log("BlockFetcher.prototype.fetchAndUpdateBlock--Promise.all->", err);
        return oThis.callback(nextStartBlockNo);
      }
    });
};

BlockFetcher.prototype.getBlockPromise = function (currBlockNo) {

  const oThis = this;

  return new Promise(async function (onResolve, onReject) {
    logger.log("\tBlock number", currBlockNo);

    const blockScannedStatus = await oThis.dbInteract.isBlockInserted(currBlockNo);
    if (blockScannedStatus) return onResolve({isProcessed: true});

    oThis.web3Interact.isNodeConnected()
      .then(function () {
        console.log("getBlockProimse :: web3Interact.getBlock-----", currBlockNo);
        return onResolve(oThis.web3Interact.getBlock(currBlockNo, true));
      })
      .catch(function (err) {
        console.log("BlockFetcher.prototype.fetchAndUpdateBlock--->", err);
        return onResolve();
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

  if (blockDataArray.length < 1){
    return Promise.resolve([]);
  }

  logger.log("Inserting blocks into DB.");
  //logger.debug(blockDataResponse.data);

  return new Promise(function (resolve, reject) {
      var formattedBlockDataArray = [];
      blockDataArray.forEach(function(blockData){
        var formattedBlockData = oThis.formatBlockData(blockData, oThis.chainId);
        //logger.info("Formatted Block data", formattedBlockData);
        formattedBlockDataArray.push(formattedBlockData);
      });

    const blockObj = new BlockKlass();

    blockObj.insertMultiple(constants.BLOCKS_DATA_SEQUENCE, formattedBlockDataArray)
      .onDuplicate('block_number=block_number').fire().then(
      function (res) {
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
 * @param  {Object} transactionRes Transaction Data Json Object
 * @param  {Object} receiptRes Transaction Receipt Json Object
 * @param  {Integer}    timestamp timestamp of the block
 *
 * @return {Array}
 */
BlockFetcher.prototype.formatTransactionData = function (transactionRes, receiptRes, chainId) {

  const db_config = core_config.getChainDbConfig(chainId);
  const txn_attributes = db_config.txnAttributes;

  var insertionArray = [];
  for (var resInd in transactionRes) {
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
BlockFetcher.prototype.writeTransactionsToDB = function (blockDataArray) {

  var oThis = this;

  if (blockDataArray == undefined || blockDataArray.length <= 0) {
    return Promise.resolve([]);
  }

  logger.info("Total block data ", blockDataArray.length);

  //console.debug("Transaction Array", transactions);
  return new Promise(function (resolve, reject) {
    var promiseReceiptArray = [];
    var transactionsArray = [];
    for (var blockInd in blockDataArray) {
      var block = blockDataArray[blockInd];
      for (var txnInd in block.transactions) {
        var txn = block.transactions[txnInd];
        txn.timestamp = block.timestamp;
        transactionsArray.push(txn);
        promiseReceiptArray.push(oThis.web3Interact.getReceipt(txn.hash));
      }
    }

    Promise.all(promiseReceiptArray)
      .then(async function (res) {
        const receiptArray = res;

        var insertionTransactionArray = oThis.formatTransactionData(transactionsArray, receiptArray, oThis.chainId);

        await oThis.dbInteract.insertTransaction(insertionTransactionArray);

        return insertionTransactionArray;
      })
      .then(resolve, reject);
  });
};

/**
 * To write Token Transactions in to DB from the transaction Array.
 *
 * @param  {Array} transactionArray Array of transactions
 *
 * @return {Promise}
 */
BlockFetcher.prototype.writeTokenTransactionToDB = function (transactionArray) {

  var oThis = this;

  if (transactionArray.length < 1){
    return Promise.resolve([]);
  }

  return new Promise(function (resolve, reject) {
      logger.log("TokenTransaction#Logs ");
      var decodedTxnArray = [];
      for (var txnIndex in transactionArray) {
        var transaction = transactionArray[txnIndex];
        var decodedContTransaction = erctoken.decodeTransactionsFromLogs(JSON.parse(transaction[constants['TRANSACTION_INDEX_MAP']['logs']]));
        var decodedTxn = oThis.formatTokenTransactionData(transaction, decodedContTransaction);
        for (var index in decodedTxn) {
          decodedTxnArray.push(decodedTxn[index]);
        }
      }

      logger.info("Total internal transactions ", decodedTxnArray.length);
      //logger.debug(decodedTxnArray);

      oThis.dbInteract.insertTokenTransaction(decodedTxnArray)
        .then(
        function (res) {
          resolve(transactionArray);
        }, reject);
  });
};

/**
 * To Handle relevant log events of transactions
 * @param {Array} transactions - Transactions
 */
BlockFetcher.prototype.handleTransactionLogEvents = function (transactionArray) {
  var oThis = this;
  var promiseArray = [];
  transactionArray.forEach(function (transaction) {
    var logs = JSON.parse(transaction[constants['TRANSACTION_INDEX_MAP']['logs']]);
    logger.info("Event logs", JSON.stringify(logs));
    var eventArray = erctoken.decodeLogs(logs);

    eventArray.forEach(function (event) {

      switch (event.eventName) {
        case 'RegisteredBrandedToken':
          //Format data for insertion
          var result = oThis.dbInteract.numberOfRowsInBrandedTokenTable()
            .then(function (noOfRows) {
              if (noOfRows <= 0) {
                oThis.dbInteract.initBrandedTokenTable();
                return Promise.resolve(1);
              }
              return Promise.resolve(noOfRows);
            })
            .then(function (noOfRows) {
              oThis.web3Interact.getTotalSupply(event._token.toLowerCase())
                .then(function (totalSupply) {
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
                  dataRow.push(totalSupply);
                  dataRow.push(null);
                  dataRow.push(null);
                  dataRow.push(null);
                  dataRow.push(null);
                  dataRow.push(null);
                  dataRow.push(0);
                  dataRow.push(0);
                  dataRow.push(transaction[constants['TRANSACTION_INDEX_MAP']['timestamp']]);
                  dataRow.push(null);
                  return oThis.dbInteract.insertOrUpdateCompanyDataArray([dataRow])
                });
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
  newInstance: function (web3Interact, dbInteract, chainId ,singleFetch) {
    return new BlockFetcher(web3Interact, dbInteract, chainId ,singleFetch);
  }
};