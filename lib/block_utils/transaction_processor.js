"use strict";

/**
 * Fetch transactions from chain and feed them into the provided DB.
 *
 * @module lib/block_utils/block_fetcher
 */
const rootPrefix = "../.."
  , logger = require(rootPrefix + "/helpers/custom_console_logger")
  , core_config = require(rootPrefix + "/config")
  , Web3Interact = require(rootPrefix + "/lib/web3/interact/rpc_interact")
  , TransactionKlass = require(rootPrefix + "/app/models/transaction")
  , TransactionHashKlass = require(rootPrefix + "/app/models/transaction_hash")
  , AddressKlass = require(rootPrefix + "/app/models/address")
  , TransactionExtendedDetailKlass = require(rootPrefix + "/app/models/transaction_extended_detail")
  , AddressTransactionKlass = require(rootPrefix + "/app/models/address_transaction")
  , TransactionLogProcessor = require(rootPrefix + "/lib/block_utils/transaction_log_processor")
  , addressConst = require(rootPrefix + '/lib/global_constant/address')
;

const
  TX_INSERT_BATCH_SIZE = 40
;

let errInFetchingTxReceipt = null
;

/**
 * Constructor to create object of TransactionProcessor
 *
 * @param {Integer} chainId - chainId of the block chain
 *
 * @constructor
 */
const TransactionProcessor = function (chainId) {
  this.web3Interact = Web3Interact.getInstance(chainId);
  this.chainId = chainId;
};

/**
 * Initiator method
 * @param {Array} transactionsArray - Array Of transactions
 * @returns {Promise}
 */
TransactionProcessor.prototype.process = function (transactionsArray) {
  const oThis= this;
  return oThis.writeTransactionsToDB(transactionsArray)
};

/**
 * To write transactions data into the DB provided from the blockData
 *
 * @param  {Array} transactionsArray Transactions Array
 *
 * @return {Promise}
 */
TransactionProcessor.prototype.writeTransactionsToDB = async function (transactionsArray) {
  const oThis = this
    , batchSize = TX_INSERT_BATCH_SIZE
    , insertionTransactionPromises = []
  ;

  logger.log("DEBUG...", transactionsArray);
  if (transactionsArray.length <= 0) {
    return Promise.resolve(true);
  }

  let batchNo = 1;

  while (true) {
    const offset = (batchNo - 1) * batchSize
      , transactionBatchedData = transactionsArray.slice(offset, offset + batchSize)
      , batchLen = transactionBatchedData.length
    ;

    let txReceiptPromises = []
      , rPromise
    ;

    if (batchLen === 0) break;

    batchNo = batchNo + 1;

    for (let i = 0; i < batchLen; i++) {
      //RACHIN : Promise needs to be handled here.
      //rPromise -> Receipt Promise.
      const tx = transactionBatchedData[i];
      rPromise = oThis.createTransactionWithReceiptPromise(tx);
      txReceiptPromises.push(rPromise);
    }

    let transactionArray
      , txInsertPromise
    ;

    //Wait for receipts to come.
    transactionArray = await Promise.all(txReceiptPromises);

    transactionArray = oThis.cleanTransactionArray(transactionArray);

    //Ok, now we have max upto 100 transactions. Lets start the DB Operations
    txInsertPromise = oThis.createTxInsertPromise(transactionArray);
    insertionTransactionPromises.push(txInsertPromise);
  }

  let isInsertSucceeded = true;
  //await Promise.all( insertionTransactionPromises , function () {
  //  logger.win("block_fetcher :: writeTransactionsToDB :: insertionTransaction completed.");
  //});

  return Promise.all(insertionTransactionPromises)
    .then(function (isSuccessedArray) {
      for (let i = 0; i < isSuccessedArray.length; i++) {
        const isSucceeded = isSuccessedArray[i];
        isInsertSucceeded = isInsertSucceeded && isSucceeded;
      }
      return isInsertSucceeded;
    })
    .catch(function () {
      isInsertSucceeded = false;
      return isInsertSucceeded;
    });

};

TransactionProcessor.prototype.createTransactionWithReceiptPromise = function (transaction) {
  const oThis = this
    , txHash = transaction.hash
  ;

  return oThis.web3Interact.getTransaction( txHash )
    .catch( function ( reason ) {
      logger.error("******************** did not get transaction for", txHash);
      return null;
    })
    .then( function ( tx ) {
      Object.assign(transaction, tx);
      return oThis.web3Interact.getReceipt(txHash);
    })
    .then(function (txReceipt) {
      logger.log("got txReceipt for", txHash);
      transaction = Object.assign(transaction, txReceipt);
      return Promise.resolve(transaction);
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

/**
 * Create Logs Array from Transaction Array
 * @param transactionArray transactions Array
 */
TransactionProcessor.getLogsArray = function (transactionArray) {
};

TransactionProcessor.prototype.createTxInsertPromise = function (transactionArray) {
  const oThis = this;


  //i_d_c -> I Dont Care.
  let shouldContinue = true
    , noOfTx = transactionArray.length
    , orgTs = Date.now()
    , prevTs = orgTs
    , newTs
  ;
  logger.log("transactionProcessor :: writeTransactionsToDB :: createTxInsertPromise :: calling insertTransaction");
  return oThis.processTransactionsWithIds(transactionArray)
    .then(function (processTransactionArray) {
      return oThis.insertTransactions(processTransactionArray)
    })
    .catch(function (reason) {
      logger.error("transactionProcessor :: writeTransactionsToDB :: createTxInsertPromise :: insertTransaction rejected the promise.");
      logger.error("reason", reason);
      shouldContinue = false;
      return transactionArray;
    })
    .then(async function (i_d_c) {
      if (shouldContinue) {

        // const logsArray = [];
        //
        // for (let ind in transactionArray) {
        //   const txn = transactionArray[ind];
        //   logsArray.push({txn_hash:txn.hash, logs:txn.logs, timestamp: txn.timestamp});
        // }

        //Log Times
        newTs = Date.now();
        logger.info("transactionProcessor :: insertTransaction :: took ", (newTs - prevTs), " miliSeconds", "noOfTx", noOfTx);
        prevTs = newTs;

        logger.log("transactionProcessor :: writeTransactionsToDB :: createTxInsertPromise :: calling writeTokenTransactionToDB");
        return await TransactionLogProcessor.newInstance(oThis.chainId).process(transactionArray);

      } else {
        logger.info("transactionProcessor :: writeTransactionsToDB :: createTxInsertPromise :: writeTokenTransactionToDB has been skipped");
        return transactionArray;
      }
    })
    .catch(function (reason) {
      logger.error("transactionProcessor :: writeTransactionsToDB :: createTxInsertPromise :: writeTokenTransactionToDB rejected the promise.");
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
};

/**
 * Insert all the processed Transaction Array
 * @param processedTransactionArray Processed Transaction Array
 * @returns {Promise<*>}
 */
TransactionProcessor.prototype.insertTransactions = async function (processedTransactionArray) {
  const oThis = this
    , formattedTxnArray = processedTransactionArray.formattedTxnArray
    , formattedExtendedTxnArray = processedTransactionArray.formattedExtendedTxnArray
    , formattedAddrTxnArray = processedTransactionArray.formattedAddrTxnArray
  ;

  let offset = 0;
  try {
    while (true) {
      const txnArray = formattedTxnArray.slice(offset, TX_INSERT_BATCH_SIZE);
      if (txnArray.length <= 0) {
        break;
      }

      await new TransactionKlass(oThis.chainId).insertMultiple(TransactionKlass.DATA_SEQUENCE_ARRAY, txnArray, {insertWithIgnore: true}).fire();

      offset += TX_INSERT_BATCH_SIZE;
    }
  } catch (err) {
    logger.error("TransactionProcessor :: insertTransactions :: formattedTxnArray :: try catch :: ", err);
    return Promise.reject(err);
  }

  offset = 0;
  try {
    while (true) {
      const txnArray = formattedExtendedTxnArray.slice(offset, TX_INSERT_BATCH_SIZE);
      if (txnArray.length <= 0) {
        break;
      }

      await new TransactionExtendedDetailKlass(oThis.chainId).insertMultiple(TransactionExtendedDetailKlass.DATA_SEQUENCE_ARRAY, txnArray, {insertWithIgnore: true}).fire();

      offset += TX_INSERT_BATCH_SIZE;
    }
  } catch (err) {
    logger.error("TransactionProcessor :: insertTransactions :: formattedExtendedTxnArray ::try catch :: ", err);
    return Promise.reject(err);
  }

  offset = 0;
  try {
    while (true) {
      const txnArray = formattedAddrTxnArray.slice(offset, TX_INSERT_BATCH_SIZE);
      if (txnArray.length <= 0) {
        break;
      }

      await new AddressTransactionKlass(oThis.chainId).insertMultiple(AddressTransactionKlass.DATA_SEQUENCE_ARRAY, txnArray, {insertWithIgnore: true}).fire();

      offset += TX_INSERT_BATCH_SIZE;
    }
  } catch (err) {
    logger.error("TransactionProcessor :: insertTransactions :: formattedAddrTxnArray ::try catch :: ", err);
    return Promise.reject(err);
  }

  return Promise.resolve(processedTransactionArray);
};

/**
 * Format ExtendedTransactionData
 * @param transactionArray Transaction Array
 * @param txnIdHash Transaction Id Hash
 */
TransactionProcessor.prototype.formatExtendedTransactionData = function (transactionArray, txnIdHash) {

  const oThis = this
    , extendedTxnArray = []
    , db_config = core_config.getChainDbConfig(oThis.chainId)
    , txn_attributes = db_config.txnAttributes
  ;

  for (let ind in transactionArray) {
    const txn = transactionArray[ind];
    const formattedTxn = [];
    formattedTxn.push(txnIdHash[txn.hash]);
    formattedTxn.push(txn.input);
    formattedTxn.push(JSON.stringify(txn.logs));

    //Optionals
    formattedTxn.push(txn_attributes.indexOf("logsBloom") > -1 ? txn.logsBloom : null);
    formattedTxn.push(txn_attributes.indexOf("r") > -1 ? txn.r : null);
    formattedTxn.push(txn_attributes.indexOf("s") > -1 ? txn.s : null);
    formattedTxn.push(txn_attributes.indexOf("v") > -1 ? txn.v : null);

    extendedTxnArray.push(formattedTxn);
  }

  return extendedTxnArray;
};

/**
 * Format ExtendedTransactionData
 * @param transactionArray Transaction Array
 * @param txnIdHash Transaction Id Hash
 * @param addressIdHash Address Id Hash
 */
TransactionProcessor.prototype.formatAddressTransactionData = function (transactionArray, txnIdHash, addressIdHash) {

  const oThis = this
    , addressTxnArray = []
  ;

  for (let ind in transactionArray) {
    const txn = transactionArray[ind];

    console.log(txn);
    const addressTxnFirst = [];
    const addressTxnSecond = [];

    addressTxnFirst.push(addressIdHash[txn.from]);
    addressTxnSecond.push(addressIdHash[txn.to]);

    addressTxnFirst.push(addressIdHash[txn.to]);
    addressTxnSecond.push(addressIdHash[txn.from]);

    addressTxnFirst.push(txnIdHash[txn.hash]);
    addressTxnSecond.push(txnIdHash[txn.hash]);

    addressTxnFirst.push(txn.value);
    addressTxnSecond.push(txn.value);

    const fees = txn.gasPrice * txn.gasUsed;
    addressTxnFirst.push(fees);
    addressTxnSecond.push(fees);

    addressTxnFirst.push(0);
    addressTxnSecond.push(1);

    addressTxnFirst.push(txn.timestamp);
    addressTxnSecond.push(txn.timestamp);

    //Push address transactions
    addressTxnArray.push(addressTxnFirst);
    if (txn.to && txn.to !== txn.from) {
      addressTxnArray.push(addressTxnSecond);
    }

  }

  return addressTxnArray;
};

/**
 * Process transactions to replace address and hashes with ids
 * @param {Array} transactionArray Transaction Array
 * @returns {Promise<*>}
 */
TransactionProcessor.prototype.processTransactionsWithIds = async function (transactionArray) {
  const oThis = this
    , txnHashesArray = []
    , addressesHashesArray = []
  ;

  const addressObject = new AddressKlass(oThis.chainId);
  for(let ind in transactionArray) {
    const txn = transactionArray[ind];
    txnHashesArray.push([txn.hash]);
    txn.from && addressesHashesArray.push([txn.from, addressObject.invertedAddressTypes[addressConst.userAddress]]);
    txn.to && addressesHashesArray.push([txn.to, addressObject.invertedAddressTypes[addressConst.userAddress]]);
    txn.contractAddress && addressesHashesArray.push([txn.contractAddress, addressObject.invertedAddressTypes[addressConst.contractAddress]]);
  }

  let offset = 0;
  const txnIdHash = {};
  const addressIdHash = {};
  try {
    while (true) {
      const txnSubArray = txnHashesArray.slice(offset, TX_INSERT_BATCH_SIZE);
      if (txnSubArray.length <= 0) {
        break;
      }

      await new TransactionHashKlass(oThis.chainId).insertMultiple(TransactionHashKlass.DATA_SEQUENCE_ARRAY, txnSubArray, {insertWithIgnore: true}).fire();

      const txnHashArray = [];
      for (let ind in txnSubArray) {
        txnHashArray.push(txnSubArray[ind][0]);
      }

      const responseArray = await new TransactionHashKlass(oThis.chainId).select('id, transaction_hash').where(['transaction_hash IN (?)', txnHashArray]).fire();

      for (let ind in responseArray) {
        const entity = responseArray[ind];
        txnIdHash[entity.transaction_hash] = Number(entity.id);
      }

      offset += TX_INSERT_BATCH_SIZE;
    }
  } catch (err) {
    logger.error("BlockFetcher :: processTransactionsWithIds :: txnHashesArray :: try catch :: ", err);
    return Promise.reject(err);
  }

  offset = 0;
  try {
    while (true) {
      const addressSubArray = addressesHashesArray.slice(offset, TX_INSERT_BATCH_SIZE);
      if (addressSubArray.length <= 0) {
        break;
      }

      await new AddressKlass(oThis.chainId).insertMultiple(AddressKlass.DATA_SEQUENCE_ARRAY, addressSubArray, {insertWithIgnore: true}).fire();

      const txnHashArray = [];
      for (let ind in addressSubArray) {
        txnHashArray.push(addressSubArray[ind][0]);
      }

      const responseArray = await new AddressKlass(oThis.chainId).select('id, address_hash').where(['address_hash IN (?)', txnHashArray]).fire();

      for (let ind in responseArray) {
        const entity = responseArray[ind];
        addressIdHash[entity.address_hash] = Number(entity.id);
      }

      offset += TX_INSERT_BATCH_SIZE;
    }
  } catch (err) {
    logger.error("BlockFetcher :: processTransactionsWithIds :: addressesHashesArray :: try catch :: ", err);
    return Promise.reject(err);
  }

  const formattedTransactionDataArray = oThis.formatTransactionData(transactionArray, txnIdHash, addressIdHash);

  const formattedExtendedTransactionDataArray = oThis.formatExtendedTransactionData(transactionArray, txnIdHash, addressIdHash);

  const formattedAddressTransactionDataArray = oThis.formatAddressTransactionData(transactionArray, txnIdHash, addressIdHash);

  // console.log("FORMATTED",formattedTransactionDataArray, formattedExtendedTransactionDataArray, formattedAddressTransactionDataArray);

  return { transactionArray: transactionArray
          ,  formattedTxnArray: formattedTransactionDataArray
          , formattedExtendedTxnArray: formattedExtendedTransactionDataArray
          , formattedAddrTxnArray : formattedAddressTransactionDataArray};
};

/**
 * Format transaction data as per the data sequence of insertion into DB.
 *
 * @param  {Object} transactionRes Array of Transaction Data Json Object
 * @param  {Object} receiptRes Array of Transaction Receipt Json Object
 * @param  {Integer} chainId Chain Id
 *
 * @return {Array}
 */
TransactionProcessor.prototype.formatTransactionsArray = function (transactionRes, receiptRes, chainId) {

  const db_config = core_config.getChainDbConfig(chainId);
  const txn_attributes = db_config.txnAttributes;

  const insertionArray = []
    , len = transactionRes.length
  ;
  for (let resInd = 0; resInd < len; resInd++) {
    const txn = transactionRes[resInd];
    const rtxn = receiptRes[resInd];

    const txnArray = [];

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
 * @param  {Array} transactionDataArray Transaction Data Json Object
 * @param  {Object} txnIdHash Transaction Receipt Json Object
 * @param  {Object} addressIdHash ChainId
 *
 * @return {Array}
 */
TransactionProcessor.prototype.formatTransactionData = function (transactionDataArray, txnIdHash, addressIdHash) {

  const txnArray = [];

  for (let ind in transactionDataArray) {
    const txn = transactionDataArray[ind];
    const formattedTxn = [];
    formattedTxn.push(txnIdHash[txn.hash]);
    formattedTxn.push(txn.blockNumber);
    formattedTxn.push(txn.transactionIndex);
    formattedTxn.push(txn.contractAddress ? addressIdHash[txn.contractAddress] : null);
    formattedTxn.push(addressIdHash[txn.from]);
    formattedTxn.push(addressIdHash[txn.to]);
    formattedTxn.push(txn.value);
    formattedTxn.push(txn.gasUsed);
    formattedTxn.push(txn.gasPrice);
    formattedTxn.push(txn.nonce);
    formattedTxn.push(txn.timestamp);
    formattedTxn.push(0);

    txnArray.push(formattedTxn);
  }

  return txnArray;
};

/**
 * Clean Transaction Array from undefined values
 * @param {Array} transactionArray Array of transactions
 * @returns {Array}
 */
TransactionProcessor.prototype.cleanTransactionArray = function (transactionArray) {
  const oThis = this;

  let cleanedUpArray = []
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

module.exports = {

  //mock instance
  instance: null,

  newInstance: function (chainId) {
    return this.instance || new TransactionProcessor(chainId);
  },

  setInstance: function (instance) {
    const oThis = this;
    if ('development' !== process.env.OST_VIEW_ENVIRONMENT) {
      logger.error("transaction_processor :: cannot call setInstance in development environment");
      process.exit(1);
    }
    oThis.instance = instance;
  }
};