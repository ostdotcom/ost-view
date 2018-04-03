"use strict";

/**
 * Fetch transactions from chain and feed them into the provided DB.
 *
 * @module lib/block_utils/transaction_processor
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
  , ercToken = require(rootPrefix + "/lib/contract_interact/contractDecoder")
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

const
  TX_INSERT_BATCH_SIZE = 40
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
  this.errInFetchingTxReceipt = false;
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


  if (transactionsArray.length <= 0) {
    return Promise.resolve(responseHelper.successWithData({isInsertSucceeded :true
      ,errInFetchingTxReceipt: false }));
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
      const tx = transactionBatchedData[i];
      //Todo:: insert txn hashes in txnhash table and fetch receipt in parallel
      rPromise = oThis.createTransactionWithReceiptPromise(tx);
      txReceiptPromises.push(rPromise);
    }

    let subTransactionArray
      , txInsertPromise
    ;

    //Wait for receipts to come.
    subTransactionArray = await Promise.all(txReceiptPromises);

    subTransactionArray = oThis.cleanTransactionArray(subTransactionArray);

    //Ok, now we have max upto 100 transactions. Lets start the DB Operations
    txInsertPromise = oThis.createTxInsertPromise(subTransactionArray);
    insertionTransactionPromises.push(txInsertPromise);
  }

  let isInsertSucceeded = true;

  return Promise.all(insertionTransactionPromises)
    .then(function (isSuccessedArray) {
      for (let i = 0; i < isSuccessedArray.length; i++) {
        const isSucceeded = isSuccessedArray[i];
        isInsertSucceeded = isInsertSucceeded && isSucceeded;
      }
      if (isInsertSucceeded) {
        return responseHelper.successWithData({isInsertSucceeded :true
          ,errInFetchingTxReceipt: false });
      } else {
        return responseHelper.error('transaction_processor', 'Insertion not successful');
      }
    })
    .catch(function () {
      return responseHelper.error('transaction_processor', 'Insertion not successful');
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
      oThis.errInFetchingTxReceipt = true;

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

  let transactionHashId,
    addressHashId;
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

      transactionHashId = processTransactionArray.transactionHashId;
      addressHashId = processTransactionArray.addressHashId;

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
        return await TransactionLogProcessor.newInstance(oThis.chainId).process(transactionArray, transactionHashId, addressHashId);

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
      const txnArray = formattedTxnArray.slice(offset, offset + TX_INSERT_BATCH_SIZE);
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
      const txnArray = formattedExtendedTxnArray.slice(offset, offset + TX_INSERT_BATCH_SIZE);
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
      const txnArray = formattedAddrTxnArray.slice(offset, offset + TX_INSERT_BATCH_SIZE);
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
    , addressesHashes = {}
  ;

  const addressObject = new AddressKlass(oThis.chainId)
      , ADDR_TYPE_USER = addressObject.invertedAddressTypes[addressConst.userAddress]
      , ADDR_TYPE_CONTRACT = addressObject.invertedAddressTypes[addressConst.contractAddress]
      , ADDR_TYPE_ERC20 = addressObject.invertedAddressTypes[addressConst.erc20Address]
  ;
  for(let ind in transactionArray) {
    let txn = transactionArray[ind];

    //Convert To lower case
    txn.hash && (txn.hash = txn.hash.toLowerCase());
    let toAddr = txn.to =  String( txn.to || "" ).toLowerCase();
    let fromAddr = txn.from =  String( txn.from || "" ).toLowerCase();
    let contractAddr = txn.contractAddress = String( txn.contractAddress || "" ).toLowerCase();


    txnHashesArray.push([txn.hash]);

    if ( fromAddr.length && !addressesHashes[ fromAddr ] ) {
      addressesHashesArray.push([fromAddr, ADDR_TYPE_USER ]);
      addressesHashes[ fromAddr ] = ADDR_TYPE_USER;
    }

    if ( toAddr.length && !addressesHashes[ toAddr ] ) {
      addressesHashesArray.push([toAddr, ADDR_TYPE_USER ]);
      addressesHashes[ toAddr ] = ADDR_TYPE_USER;
    }

    if ( contractAddr.length ) {
      if ( !addressesHashes[ contractAddr ] ) {
        addressesHashesArray.push([contractAddr, ADDR_TYPE_CONTRACT ]);
        addressesHashes[ contractAddr ] = ADDR_TYPE_CONTRACT;
      } else if ( addressesHashes[ contractAddr ] === ADDR_TYPE_USER ) {
        addressesHashes[ contractAddr ] = ADDR_TYPE_CONTRACT;
      }
    }


    let logs = txn.logs;
    txn.decodedLogs = ercToken.decodeLogs(logs);

    for (let secInd in txn.decodedLogs['Transfer']) {
      let interTransfer = txn.decodedLogs['Transfer'][secInd];

      //Convert To lower case
      let toAddr = interTransfer._to =  String( interTransfer._to || "" ).toLowerCase();
      let fromAddr = interTransfer._from =  String( interTransfer._from || "" ).toLowerCase();
      let contractAddr = interTransfer.address = String( interTransfer.address || "" ).toLowerCase();


      if ( fromAddr.length && !addressesHashes[ fromAddr ] ) {
        addressesHashesArray.push([fromAddr, ADDR_TYPE_USER ]);
        addressesHashes[ fromAddr ] = ADDR_TYPE_USER;
      }

      if ( toAddr.length && !addressesHashes[ toAddr ] ) {
        addressesHashesArray.push([toAddr, ADDR_TYPE_USER ]);
        addressesHashes[ toAddr ] = ADDR_TYPE_USER;
      }

      if ( contractAddr.length ) {
        if ( !addressesHashes[ contractAddr ] ) {
          addressesHashesArray.push([contractAddr, ADDR_TYPE_CONTRACT ]);
          addressesHashes[ contractAddr ] = ADDR_TYPE_ERC20;
        } else if ( addressesHashes[ contractAddr ] === ADDR_TYPE_USER ) {
          addressesHashes[ contractAddr ] = ADDR_TYPE_ERC20;
        }
      }
    }
  }

  // console.log('DEBUG', txnHashesArray, addressesHashesArray, addressesHashes);
  let offset = 0;
  const txnIdHash = {};
  const addressIdHash = {};
  try {
    while (true) {
      const txnSubArray = txnHashesArray.slice(offset, offset + TX_INSERT_BATCH_SIZE);
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
          txnIdHash[entity.transaction_hash.toLowerCase()] = Number(entity.id);
        }

      offset += TX_INSERT_BATCH_SIZE;
    }
  } catch (err) {
    logger.error("TransactionProcessor :: processTransactionsWithIds :: txnHashesArray :: try catch :: ", err);
    return Promise.reject(err);
  }

  offset = 0;
  const addressObj = new AddressKlass(oThis.chainId);
  try {
    while (true) {
      const addressSubArray = addressesHashesArray.slice(offset, offset + TX_INSERT_BATCH_SIZE);
      if (addressSubArray.length <= 0) {
        break;
      }

      await new AddressKlass(oThis.chainId).insertMultiple(AddressKlass.DATA_SEQUENCE_ARRAY, addressSubArray)
        .onDuplicate('address_type = IF(VALUES(address_type)!=' + addressObj.invertedAddressTypes[addressConst.userAddress] + ', VALUES(address_type) , address_type)').fire();

      const txnHashArray = [];
      for (let ind in addressSubArray) {
        txnHashArray.push(addressSubArray[ind][0]);
      }

      const responseArray = await new AddressKlass(oThis.chainId).select('id, address_hash').where(['address_hash IN (?)', txnHashArray]).fire();

        for (let ind in responseArray) {
          const entity = responseArray[ind];
          addressIdHash[entity.address_hash.toLowerCase()] = Number(entity.id);
        }

      offset += TX_INSERT_BATCH_SIZE;
    }
  } catch (err) {
    logger.error("TransactionProcessor :: processTransactionsWithIds :: addressesHashesArray :: try catch :: ", err);
    return Promise.reject(err);
  }

  const formattedTransactionDataArray = oThis.formatTransactionData(transactionArray, txnIdHash, addressIdHash);

  const formattedExtendedTransactionDataArray = oThis.formatExtendedTransactionData(transactionArray, txnIdHash, addressIdHash);

  const formattedAddressTransactionDataArray = oThis.formatAddressTransactionData(transactionArray, txnIdHash, addressIdHash);

  // console.log("FORMATTED",formattedTransactionDataArray, formattedExtendedTransactionDataArray, formattedAddressTransactionDataArray);

  return { formattedTxnArray: formattedTransactionDataArray
          , formattedExtendedTxnArray: formattedExtendedTransactionDataArray
          , formattedAddrTxnArray : formattedAddressTransactionDataArray
          , addressHashId : addressIdHash
          , transactionHashId : txnIdHash}

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
    if (!addressIdHash[txn.from]) {
      logger.log('DEBUG',txn.from, addressIdHash);
      process.exit(1);
    }
    formattedTxn.push(addressIdHash[txn.from]);
    formattedTxn.push(addressIdHash[txn.to]);
    formattedTxn.push(txn.value);
    formattedTxn.push(txn.gasUsed);
    formattedTxn.push(txn.gasPrice);
    formattedTxn.push(txn.nonce);
    formattedTxn.push(txn.timestamp);
    formattedTxn.push(parseInt(Number(txn.status).toString(10)));

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