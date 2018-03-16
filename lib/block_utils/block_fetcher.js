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
;

const MAX_BATCH_SIZE = 40;

/**
 * Constructor to create object of BlockFetcher
 *
 * @param {Web3Object} web3Interact Web3RPC Object
 * @param {Object} dbInteract DB object to interact
 * @param {Integer} chainId - chainId of the block chain
 * @param {Boolean} verifier verifier flag
 *
 * @constructor
 */
const BlockFetcher = function (web3Interact, dbInteract, chainId ,verifier) {
  this.web3Interact = web3Interact;
  this.dbInteract = dbInteract;
  this.chainId = chainId;
  this.verifier = verifier;
  this.state = {
    blockNumber: 0,
    lastBlock: 0
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
    , expectedBatchSize = this.state.lastBlock - blockNumber
    , batchSize = Math.min(MAX_BATCH_SIZE, expectedBatchSize)
  ;

  logger.log('abc ************* Fetch Block ***************', blockNumber);
  console.log("Determined batchSize", batchSize,  "expectedBatchSize");
  oThis.callback = insertionCompleteCallback;

  // check for undefined object
  if (blockNumber == undefined) {
    logger.log("In #fetchBlock undefined blockNumber ");
    return;
  }

  for(var i=0; i<batchSize; i++){
    var currBlockNo = blockNumber + i;
    promiseArray.push(oThis.getBlockPromise(currBlockNo));
  }

  Promise.all(promiseArray).then(function (promiseResult) {
    console.log('abc -----------1----------');
    var nextStartBlockNo = blockNumber;
    for(var i=0; i<promiseResult.length; i++){
      if(!promiseResult[i]){
        console.log("BlockFetcher.prototype.fetchAndUpdateBlock--promiseResult[i]->");
        break;
      } else {
        nextStartBlockNo = promiseResult[i] + 1;
        console.log('abc ----------in-222----------', nextStartBlockNo);
      }
    }
    console.log('abc -----------2----------', nextStartBlockNo);
    if (oThis.callback) {
      return oThis.callback(nextStartBlockNo);
    }
  }).catch(function (err) {
    if (oThis.callback) {
      console.log("abc BlockFetcher.prototype.fetchAndUpdateBlock--Promise.all->", err);
      return oThis.callback(blockNumber+1);
    }
  });

  // logger.log("\tBlock number", blockNumber);
  //
  // oThis.web3Interact.isNodeConnected()
  //   .then(function () {
  //     return oThis.web3Interact.getBlock(blockNumber);
  //   })
  //   .then(function (response) {
  //     return oThis.writeBlockToDB(response)
  //   })
  //   .then(function (response) {
  //     return oThis.writeTransactionsToDB(response)
  //   })
  //   .then(function (response) {
  //     return oThis.writeTokenTransactionToDB(response)
  //   })
  //   .then(function(response){
  //     return oThis.handleTransactionLogEvents(response);
  //   })
  //   .then(function () {
  //     if (oThis.callback) {
  //       return oThis.callback(+blockNumber + 1);
  //     }
  //   })
  //   .catch(function (err) {
  //     return oThis.errorHandling(err)
  //   });
};

/**
 * Function to handle error and call the callback function
 *
 * @param  {ErrorObject} err Error Object
 * @return {null}
 */
BlockFetcher.prototype.errorHandling = function (err) {
  logger.log("ERROR " + err);
  if (this.callback) {
    this.callback(this.state.blockNumber);
  }
};

BlockFetcher.prototype.getBlockPromise = function(currBlockNo) {

  const oThis = this;

  return new Promise(async function (onResolve, onReject) {
    logger.log("\tBlock number", currBlockNo);

    const blockScannedStatus = await oThis.dbInteract.isBlockInserted(currBlockNo);
    if(blockScannedStatus) return onResolve(currBlockNo);

    oThis.web3Interact.isNodeConnected()
      .then(function () {
        console.log("abc web3Interact.getBlock-----", currBlockNo);
        return oThis.web3Interact.getBlock(currBlockNo);
      })
      .then(function (response) {
        console.log("abc writeBlockToDB-----", currBlockNo);
        return oThis.writeBlockToDB(response)
      })
      .then(function (response) {
        return oThis.writeTransactionsToDB(response)
      })
      .then(function (response) {
        return oThis.writeTokenTransactionToDB(response)
      })
      .then(function(response){
        return oThis.handleTransactionLogEvents(response);
      })
      .then(function () {
        console.log("abc final-----", currBlockNo);
        return onResolve(currBlockNo);
      })
      .catch(function (err) {
        console.log("abc BlockFetcher.prototype.fetchAndUpdateBlock--->", err);
        return onResolve();
      });
  });

};

BlockFetcher.prototype.isBlockScanned = function (blockNo) {
  return
};

/**
 * Write Block Json Data object into the provided DB.
 *
 * @param  {Object} blockDataResponse Block Data Json Object
 *
 * @return {Promise}
 */
BlockFetcher.prototype.writeBlockToDB = function (blockDataResponse) {

  var oThis = this;

  logger.log("Importing block into DB. Please wait.");
  //logger.debug(blockDataResponse.data);

  return new Promise(function (resolve, reject) {
    if (blockDataResponse.success != true) {
      logger.log("Block success failure");
      reject('Block Fetch failed');
    } else {
      logger.log("Verifier :", oThis.verifier);
      var blockData = oThis.formatBlockData(blockDataResponse.data, oThis.chainId, oThis.verifier);
      oThis.dbInteract.insertBlock(blockData).then(
        function (res) {
          //console.log(res);
          resolve(blockDataResponse.data);
        }, reject);
    }
  });

};

/**
 * Format block data as per the data sequence of insertion into DB.
 *
 * @param  {Object} rawBlockData Block Data Json Object
 * @param  {Boolean}    verifier Verifier flag
 *
 * @return {Array}
 */
BlockFetcher.prototype.formatBlockData = function (rawBlockData, chainId ,verifier) {

  const db_config = core_config.getChainDbConfig(chainId);
  const block_attributes = db_config.blockAttributes;

  var formatedBlockData = [];
  formatedBlockData.push(rawBlockData.number);
  formatedBlockData.push(rawBlockData.hash);
  formatedBlockData.push(rawBlockData.parentHash);
  formatedBlockData.push(rawBlockData.miner);
  formatedBlockData.push(rawBlockData.difficulty);
  formatedBlockData.push(rawBlockData.totalDifficulty);
  formatedBlockData.push(rawBlockData.gasLimit);
  formatedBlockData.push(rawBlockData.gasUsed);
  formatedBlockData.push(rawBlockData.transactions.length);
  formatedBlockData.push(rawBlockData.timestamp);
  formatedBlockData.push(verifier);

  //optional
  formatedBlockData.push( block_attributes.indexOf("nonce") > -1 ? rawBlockData.nonce : null );
  formatedBlockData.push( block_attributes.indexOf("sha3Uncles") > -1 ? rawBlockData.sha3Uncles : null );
  formatedBlockData.push( block_attributes.indexOf("uncles") > -1 ? rawBlockData.uncles : null );
  formatedBlockData.push( block_attributes.indexOf("logsBloom") > -1 ? rawBlockData.logsBloom : null );
  formatedBlockData.push( block_attributes.indexOf("transactionsRoot") > -1 ? rawBlockData.transactionsRoot : null );
  formatedBlockData.push( block_attributes.indexOf("transactions") > -1 ? rawBlockData.transactions : null );
  formatedBlockData.push( block_attributes.indexOf("stateRoot") > -1 ? rawBlockData.stateRoot : null );
  formatedBlockData.push( block_attributes.indexOf("receiptRoot") > -1 ? rawBlockData.receiptRoot : null );
  formatedBlockData.push( block_attributes.indexOf("size") > -1 ? rawBlockData.size : null );
  formatedBlockData.push( block_attributes.indexOf("extraData") > -1 ? rawBlockData.extraData : null );
  formatedBlockData.push( block_attributes.indexOf("mixHash") > -1 ? rawBlockData.mixHash : null );
  return formatedBlockData;
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
BlockFetcher.prototype.formatTransactionData = function (transactionRes, receiptRes, timestamp, chainId) {

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
    txnArray.push(timestamp);

    //Optionals
    txnArray.push( txn_attributes.indexOf("status") > -1 ? rtxn.status : null );
    txnArray.push( txn_attributes.indexOf("logsBloom") > -1 ? rtxn.logsBloom : null );
    txnArray.push( txn_attributes.indexOf("r") > -1 ? txn.r : null );
    txnArray.push( txn_attributes.indexOf("s") > -1 ? txn.s : null );
    txnArray.push( txn_attributes.indexOf("v") > -1 ? txn.v : null );

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
 * @param  {Object} blockData Block Data Json Object
 *
 * @return {Promise}
 */
BlockFetcher.prototype.writeTransactionsToDB = function (blockData) {

  var oThis = this;

  var bulkOps = [];
  var transactions = blockData.transactions;

  if (transactions == undefined || transactions.length <= 0) {
    return Promise.resolve([]);
  }

  logger.info("Total Transactions", transactions.length);

  //console.debug("Transaction Array", transactions);
  return new Promise(function (resolve, reject) {
    var promiseReceiptArray = [];
    var promiseTransactionArray = [];
    for (var index in transactions) {
      logger.info("Transaction :", transactions[index]);

      var promiseReceipt = oThis.web3Interact.getReceipt(transactions[index]);
      var promiseTransaction = oThis.web3Interact.getTransaction(transactions[index]);

      promiseReceiptArray.push(promiseReceipt);
      promiseTransactionArray.push(promiseTransaction);
    }

    Promise.all([Promise.all(promiseTransactionArray), Promise.all(promiseReceiptArray)])
      .then(
        async function(res){
          const transactionRes = res[0];
          const receiptRes = res[1];

          var insertionTransactionArray = oThis.formatTransactionData(transactionRes, receiptRes, blockData.timestamp, oThis.chainId);

          await oThis.dbInteract.insertTransaction(insertionTransactionArray);

          return insertionTransactionArray;

        }
      ).then(resolve, reject);
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

  return new Promise(function (resolve, reject) {
    if (transactionArray.length > 0) {
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
    } else {
      resolve(transactionArray);
    }
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
            .then(function(noOfRows){
              if(noOfRows <= 0){
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
  newInstance: function (web3Interact, dbInteract, chainId ,verifier) {
    return new BlockFetcher(web3Interact, dbInteract, chainId ,verifier);
  }
};