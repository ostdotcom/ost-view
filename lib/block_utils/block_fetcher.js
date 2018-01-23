"use strict"
/**
 * Fetch blocks from chain and feed them into the provided DB.
 *
 * @module lib/block_utils/block_fetcher
 */
const rootPrefix = "../.."
  , logger = require(rootPrefix + "/helpers/custom_console_logger")
  , erctoken = require(rootPrefix + "/lib/contract_interact/erc20Token")
  , constants = require(rootPrefix + "/config/core_constants")
;

/**
 * Constructor to create object of BlockFetcher
 *
 * @param {Web3Object} web3Interact Web3RPC Object
 * @param {Object} dbInteract DB object to interact
 * @param {Boolean} verifier verifier flag
 *
 * @constructor
 */
const BlockFetcher = function (web3Interact, dbInteract, verifier) {
  this.web3Interact = web3Interact;
  this.dbInteract = dbInteract;
  this.verifier = verifier;
};

/**
 * State of the fetcher with config details.
 * @type {Object}
 */
BlockFetcher.prototype.state = {
  blockNumber: 0
};

/**
 * Method to fetch block using blockNumber
 *
 * @param  {Integer} blockNumber Block Number
 * @param  {FunctionCallback} insertionCompleteCallback Insertion Complete Callback
 *
 * @return {null}
 */
BlockFetcher.prototype.fetchAndUpdateBlock = function (blockNumber, insertionCompleteCallback) {

  this.callback = insertionCompleteCallback;
  var oThis = this;

  // check for undefined object
  if (blockNumber == undefined) {
    logger.log("In #fetchBlock undefined blockNumber ");
    return;
  }

  // Set state
  oThis.state.blockNumber = blockNumber;
  logger.log('************* New Block ***************')

  logger.log("\tBlock number", blockNumber);

  oThis.web3Interact.isNodeConnected()
    .then(function () {
      return oThis.web3Interact.getBlock(blockNumber);
    })
    .then(function (response) {
      return oThis.writeBlockToDB(response)
    })
    .then(function (response) {
      return oThis.writeTransactionsToDB(response)
    })
    .then(function (response) {
      return oThis.writeTokenTransactionToDB(response)
    })
    .then(function (response) {
      if (oThis.callback) {
        return oThis.callback(response)
      }
    })
    .catch(function (err) {
      return oThis.errorHandling(err)
    });
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
  logger.log(blockDataResponse.data);

  return new Promise(function (resolve, reject) {
    if (blockDataResponse.success != true) {
      logger.log("Block success failure");
      reject('Block Fetch failed');
    } else {
      logger.log("Verifier :", oThis.verifier);
      var blockData = oThis.formatBlockData(blockDataResponse.data, oThis.verifier);
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
BlockFetcher.prototype.formatBlockData = function (rawBlockData, verifier) {
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
BlockFetcher.prototype.formatTransactionData = function (transactionRes, receiptRes, timestamp) {
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
    txnArray.push(txn.gas);
    txnArray.push(txn.gasPrice);
    txnArray.push(txn.nonce);
    txnArray.push(JSON.stringify(txn.input));
    txnArray.push(JSON.stringify(rtxn.logs));
    txnArray.push(timestamp);

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
    formatedContractTxn.push(transaction[constants['TRANSACTION_INDEX_MAP']['hash']]);
    formatedContractTxn.push(decodedContTransaction.address);
    formatedContractTxn.push(decodedContTransaction._from);
    formatedContractTxn.push(decodedContTransaction._to);
    formatedContractTxn.push(decodedContTransaction._value);
    formatedContractTxn.push(transaction[constants['TRANSACTION_INDEX_MAP']['timestamp']]);

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

  console.log("Transaction Array", transactions);
  return new Promise(function (resolve, reject) {
    if (transactions != undefined && transactions.length > 0) {
      var promiseReceiptArray = [];
      var promiseTransactionArray = [];
      for (var index in transactions) {
        logger.info("Transaction :", transactions[index]);

        var promiseReceipt = oThis.web3Interact.getReceipt(transactions[index]);
        var promiseTransaction = oThis.web3Interact.getTransaction(transactions[index]);

        promiseReceiptArray.push(promiseReceipt);
        promiseTransactionArray.push(promiseTransaction);
      }

      Promise.all(promiseTransactionArray)
        .then(function (res) {
          var transactionRes = res;
          Promise.all(promiseReceiptArray)
            .then(function (res) {
              var receiptRes = res;
              var insertionTransactionArray = oThis.formatTransactionData(transactionRes, receiptRes, blockData.timestamp);
              oThis.dbInteract.insertTransaction(insertionTransactionArray).then(
                function (res) {
                  resolve(insertionTransactionArray);
                }, reject);
            }, reject);
        }, reject);
    } else {
      resolve([]);
    }

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
      logger.log(decodedTxnArray);
      oThis.dbInteract.insertTokenTransaction(decodedTxnArray)
        .then(
          function (res) {
            resolve(+oThis.state.blockNumber + 1);
          }, reject);
    } else {
      resolve(+oThis.state.blockNumber + 1);
    }
  });
};


module.exports = {
  newInstance: function (web3Interact, dbInteract, verifier) {
    return new BlockFetcher(web3Interact, dbInteract, verifier);
  }
};