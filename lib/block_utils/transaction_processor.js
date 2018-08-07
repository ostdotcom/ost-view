"use strict";

/**
 * Process transactions and feed them into the provided DB.
 *
 * @module lib/block_utils/transaction_processor
 */
const rootPrefix = "../.."
  , logger = require(rootPrefix + "/helpers/custom_console_logger")
  , config = require(rootPrefix + "/config")
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
  , CacheAddAddressIdKlass = require(rootPrefix + '/lib/block_utils/add_addresses')
  , transactionConst = require(rootPrefix + '/lib/global_constant/transaction')
  , TokenUnits = require(rootPrefix + "/helpers/tokenUnits")
  , TransactionCacheKlass = require(rootPrefix + '/lib/cache_management/transaction')
  , coreConstants = require(rootPrefix + '/config/core_constants')
;

const
  TX_INSERT_BATCH_SIZE = 100
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

  try {
    let batchNo = 1;

    while (true) {
      let offset = (batchNo - 1) * batchSize
        , transactionBatchedData = transactionsArray.slice(offset, offset + batchSize)
        , batchLen = transactionBatchedData.length
      ;

      let txReceiptPromises = []
        , rPromise
      ;

      if (batchLen === 0) break;

      batchNo = batchNo + 1;


      let txHashesIdMapPromise = oThis.getTransactionHashesIdMap(transactionBatchedData);
      let addressTypeHash = {};
      for (let i = 0; i < batchLen; i++) {
        let tx = transactionBatchedData[i];
        rPromise = oThis.createTransactionWithReceiptPromise(tx);
        txReceiptPromises.push(rPromise);
      }

      let subTransactionArray
        , txInsertPromise
      ;

      //Wait for receipts and txn Id Map to come.
      let compoundPromise = await Promise.all([Promise.all(txReceiptPromises),txHashesIdMapPromise]);

      subTransactionArray = compoundPromise[0];
      let txnHashesIdMap = compoundPromise[1];

      subTransactionArray = oThis.cleanTransactionArray(subTransactionArray);

      for (let i = 0; i < subTransactionArray.length; i++) {
        oThis.populateAddressTypeHash(subTransactionArray[i], addressTypeHash);
      }

      let addressHashIdMap = await oThis.getAddressHashIdMap(addressTypeHash);
      // logger.log("DEBUG", JSON.stringify(addressHashIdMap), JSON.stringify(txnHashesIdMap));

      //Ok, now we have max upto 100 transactions. Lets start the DB Operations
      txInsertPromise = oThis.createTxInsertPromise(subTransactionArray, txnHashesIdMap, addressHashIdMap);
      insertionTransactionPromises.push(txInsertPromise);
      // Clear transaction cache
      oThis.clearTransactionsCache(Object.keys(txnHashesIdMap));
    }
  } catch(error) {
    logger.error('transaction_processor :: writeTransactionsToDB ::', error);
    return responseHelper.error('transaction_processor', error);
  }


  let isInsertSucceeded = true;

  return Promise.all(insertionTransactionPromises)
    .then(function (isSuccessedArray) {
      for (let i = 0; i < isSuccessedArray.length; i++) {
        let isSucceeded = isSuccessedArray[i];
        isInsertSucceeded = isInsertSucceeded && isSucceeded;
      }
      if (isInsertSucceeded) {
        return responseHelper.successWithData({isInsertSucceeded :true
          ,errInFetchingTxReceipt: oThis.errInFetchingTxReceipt });
      } else {
        return responseHelper.error('transaction_processor', 'Insertion not successful');
      }
    })
    .catch(function () {
      return responseHelper.error('transaction_processor', 'Insertion not successful');
    });

};

/**
 * It creates transaction hash combined with receipt
 * @param {Hash} transaction - Transaction
 * @return {Promise<any>}
 */
TransactionProcessor.prototype.createTransactionWithReceiptPromise = function (transaction) {
  const oThis = this
    , txHash = transaction.hash
  ;

  return oThis.web3Interact.getTransaction( txHash )
    .then( function ( tx ) {
      Object.assign(transaction, tx);
      return oThis.web3Interact.getReceipt(txHash);
    })
    .then(function (txReceipt) {
      //logger.log("got txReceipt for", txHash);
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
 * It handles the insertion task of Transaction
 * @param {Array} transactionArray - Array of transaction
 * @param {Hash} transactionHashIdMap -  Transaction Hash Id map
 * @param {Hash} addressHashIdMap - Address Hash Id map
 * @returns {Promise<*>}
 */
TransactionProcessor.prototype.createTxInsertPromise = function (transactionArray, transactionHashIdMap, addressHashIdMap) {
  const oThis = this;

  //i_d_c -> I Dont Care.
  let shouldContinue = true
    , noOfTx = transactionArray.length
    , orgTs = Date.now()
    , prevTs = orgTs
    , newTs
  ;
  logger.log("transactionProcessor :: writeTransactionsToDB :: createTxInsertPromise :: calling insertTransaction");
  return oThis.processTransactionsWithIds(transactionArray, transactionHashIdMap, addressHashIdMap)
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

        //Log Times
        newTs = Date.now();
        logger.info("transactionProcessor :: insertTransaction :: took ", (newTs - prevTs), " miliSeconds", "noOfTx", noOfTx);
        prevTs = newTs;

        logger.log("transactionProcessor :: writeTransactionsToDB :: createTxInsertPromise :: calling writeTokenTransactionToDB");
        return await TransactionLogProcessor.newInstance(oThis.chainId).process(transactionArray, transactionHashIdMap, addressHashIdMap);

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
 * @param {Array} processedTransactionArray -  Processed Transaction Array
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

      await new AddressTransactionKlass(oThis.chainId).insertMultiple(AddressTransactionKlass.DATA_SEQUENCE_ARRAY, txnArray).fire();

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
 * @param {Array} transactionArray - Transaction Array
 * @param {Hash} txnIdHash - Transaction Id Hash
 */
TransactionProcessor.prototype.formatExtendedTransactionData = function (transactionArray, txnIdHash) {

  const oThis = this
    , extendedTxnArray = []
    , db_config = config.getChainDbConfig(oThis.chainId)
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
 * @param {Array}transactionArray - Transaction Array
 * @param {Hash} txnIdHash - Transaction Id Hash
 * @param {Hash} addressIdHash - Address Id Hash
 */
TransactionProcessor.prototype.formatAddressTransactionData = function (transactionArray, txnIdHash, addressIdHash) {

  const oThis = this
    , addressTxnArray = []
  ;


  for (let ind in transactionArray) {
    const txn = transactionArray[ind];

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

    const fees = TokenUnits.mul(txn.gasPrice,txn.gasUsed);
    addressTxnFirst.push(fees);
    addressTxnSecond.push(fees);

    addressTxnFirst.push(0);
    addressTxnSecond.push(1);

    addressTxnFirst.push(txn.timestamp);
    addressTxnSecond.push(txn.timestamp);

    //Push address transactions
    addressTxnArray.push(addressTxnFirst);

    if (txn.to) {
      addressTxnArray.push(addressTxnSecond);
    }

  }

  return addressTxnArray;
};

/**
 * Process transactions to replace address and hashes with ids
 * @param {Array} transactionArray Transaction Array
 * @param {Hash} txnIdHash Transaction Hash
 * @param {Hash} addressIdHash Address Hash
 * @returns {Promise<*>}
 */
TransactionProcessor.prototype.processTransactionsWithIds = async function (transactionArray, txnIdHash, addressIdHash) {
  const oThis = this
    ;

  const formattedTransactionDataArray = oThis.formatTransactionData(transactionArray, txnIdHash, addressIdHash);

  const formattedExtendedTransactionDataArray = oThis.formatExtendedTransactionData(transactionArray, txnIdHash, addressIdHash);

  const formattedAddressTransactionDataArray = oThis.formatAddressTransactionData(transactionArray, txnIdHash, addressIdHash);

  // console.log("FORMATTED",formattedTransactionDataArray, formattedExtendedTransactionDataArray, formattedAddressTransactionDataArray);

  return { formattedTxnArray: formattedTransactionDataArray
          , formattedExtendedTxnArray: formattedExtendedTransactionDataArray
          , formattedAddrTxnArray : formattedAddressTransactionDataArray }
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

  const oThis = this
    , txnArray = []
    , invertedTransactionStatus = new TransactionKlass(oThis.chainId).invertedStatuses
    ;

  oThis.getEnumStatus = function (status) {
    if (String(status) === '0x0'){
      return invertedTransactionStatus[transactionConst.failed];
    } else if (String(status) === '0x1'){
      return invertedTransactionStatus[transactionConst.succeeded];
    } else {
      throw 'UNEXPECTED EnumStatus for transaction'
    }
  };
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
    formattedTxn.push(oThis.getEnumStatus(txn.status));

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


TransactionProcessor.prototype.getTransactionHashesIdMap = async function (transactionsArray) {
  const oThis = this
    , txnHashesArray = []
    , txnIdHash = {}
  ;

  for(let ind=0; ind < transactionsArray.length; ind++) {
      let txn = transactionsArray[ind];

      //Convert To lower case
    txn.hash && (txn.hash = txn.hash.toLowerCase());
      txnHashesArray.push([txn.hash]);
    }

    let offset = 0;
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
  return Promise.resolve(txnIdHash);

};

/**
 * Get Address Hash Id Map
 * @param addressTypeHash
 * @return {Promise<{}>}
 */
TransactionProcessor.prototype.getAddressHashIdMap = async function (addressTypeHash) {
  const oThis = this
    , addressHashIdMap = {}
  ;
  const response = await new CacheAddAddressIdKlass({chain_id: oThis.chainId, addresses_hash: addressTypeHash}).perform();
  if (response.isSuccess()) {
    //logger.log('DEBUG TransactionProcessor :: getAddressHashIdMap :: Success Data', JSON.stringify(response.data));
    for (let key in response.data) {
      addressHashIdMap[key] = response.data[key].id;
    }
    return addressHashIdMap;
  } else {
    logger.error('getAddressHashIdMap :: MemCache return failed for addressType hash');
    throw 'MemCache return failed for addressType hash'
  }
};

/**
 * Populate address type hash
 * @param {Hash} transaction - Transaction hash
 * @param {Hash} addressTypeHash - Address Type hash
 * @return addressTypeHash
 */
TransactionProcessor.prototype.populateAddressTypeHash = function (transaction, addressTypeHash) {

  const oThis = this
    , addressObject = new AddressKlass(oThis.chainId)
    , ADDR_TYPE_USER = addressObject.invertedAddressTypes[addressConst.userAddress]
    , ADDR_TYPE_CONTRACT = addressObject.invertedAddressTypes[addressConst.contractAddress]
  ;

  const assignAddressType = function (addressTypeHash, params){
      const toAddr = params.toAddress
      , fromAddr = params.fromAddress
      , contractAddr = params.contractAddress
    ;

    if (fromAddr.length && !addressTypeHash[fromAddr]) {
      addressTypeHash[fromAddr] = {address_type: ADDR_TYPE_USER};
    }

    if (toAddr.length && !addressTypeHash[toAddr]) {
      addressTypeHash[toAddr] = {address_type: ADDR_TYPE_USER};
    }

    if (contractAddr.length) {
      addressTypeHash[contractAddr] = addressTypeHash[contractAddr] || {};
      addressTypeHash[contractAddr].address_type = ADDR_TYPE_CONTRACT;
    }
  };

  //Convert To lower case
  let toAddr = transaction.to = String(transaction.to || "").toLowerCase();
  let fromAddr = transaction.from = String(transaction.from || "").toLowerCase();
  let contractAddr = transaction.contractAddress = String(transaction.contractAddress || "").toLowerCase();

  assignAddressType(addressTypeHash, {
    toAddress: toAddr,
    fromAddress: fromAddr,
    contractAddress: contractAddr
  });

  let logs = transaction.logs;
  transaction.decodedLogs = ercToken.decodeLogs(logs);

  if (!transaction.decodedLogs['Transfer']) {
    return addressTypeHash;
  }

  for (let secInd = 0; secInd < transaction.decodedLogs['Transfer'].length; secInd++) {
    let interTransfer = transaction.decodedLogs['Transfer'][secInd];

    //Convert To lower case
    let toAddr = interTransfer._to = String(interTransfer._to || "").toLowerCase();
    let fromAddr = interTransfer._from = String(interTransfer._from || "").toLowerCase();
    let contractAddr = interTransfer.address = String(interTransfer.address || "").toLowerCase();

    assignAddressType(addressTypeHash, {
      toAddress: toAddr,
      fromAddress: fromAddr,
      contractAddress: contractAddr
    });
  }
  return addressTypeHash;
};

/**
 * Clear transaction cache
 *
 * @param transactionHashes
 */
TransactionProcessor.prototype.clearTransactionsCache = function(transactionHashes){
  const oThis = this;
  for(let i=0;i<transactionHashes.length;i++){
    let txHash = transactionHashes[i];
    new TransactionCacheKlass({chain_id: oThis.chainId, transaction_hash: txHash}).clear();
  }
};

module.exports = {

  //mock instance
  instance: null,

  newInstance: function (chainId) {
    return this.instance || new TransactionProcessor(chainId);
  },

  setInstance: function (instance) {
    const oThis = this;
    if ('development' !== coreConstants.VIEW_ENVIRONMENT) {
      logger.error("transaction_processor :: cannot call setInstance in development environment");
      process.exit(1);
    }
    oThis.instance = instance;
  }
};