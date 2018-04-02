"use strict";

/**
 * Fetch transactions from chain and feed them into the provided DB.
 *
 * @module lib/block_utils/block_fetcher
 */
const rootPrefix = "../.."
  , logger = require(rootPrefix + "/helpers/custom_console_logger")
  , ercToken = require(rootPrefix + "/lib/contract_interact/contractDecoder")
  , constants = require(rootPrefix + "/config/core_constants")
  , core_config = require(rootPrefix + "/config")
  , TokenUnits = require(rootPrefix + "/helpers/tokenUnits")
  , Web3Interact = require(rootPrefix + "/lib/web3/interact/rpc_interact")
  , TransactionHashKlass = require(rootPrefix + "/app/models/transaction_hash")
  , AddressKlass = require(rootPrefix + "/app/models/address")
  , TokenTransferKlass = require(rootPrefix + "/app/models/token_transfer")
  , AddressTokenTransferKlass = require(rootPrefix + "/app/models/address_token_transfer")
  , BrandedTokenKlass = require(rootPrefix + "/app/models/branded_token")
  , addressConst = require(rootPrefix + '/lib/global_constant/address')
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
const TransactionLogProcessor = function (chainId) {
  this.web3Interact = Web3Interact.getInstance(chainId);
  this.chainId = chainId;
};

/**
 * Get decoded logs array
 * @param transactionArray
 */
TransactionLogProcessor.prototype.getLogsDecodedArray = function (transactionArray) {
  for (let ind in transactionArray) {
    const logs = transactionArray[ind].logs;
    // logger.log("DEBUG ::", logs);
    transactionArray[ind].logs = ercToken.decodeLogs(logs);
  }
  return transactionArray;
};
/**
 * Initiator method
 * @param {Array} transactionArray - Array Of logs
 * @returns {Promise}
 */
TransactionLogProcessor.prototype.process = async function (transactionArray, transactionHashId, addressHashId) {
  const oThis = this;

  this.transactionHashId = transactionHashId;
  this.addressHashId = addressHashId;
  try {
    const decodedLogArray = oThis.getLogsDecodedArray(transactionArray);

    const processedTransferArray = await oThis.processTransfersWithIds(decodedLogArray);

    await oThis.insertTokenTransfers(processedTransferArray);

    await oThis.insertRegisteredBrandedTokens(decodedLogArray);

  } catch (error){
    logger.error("TransactionLogProcessor :: process :: try catch", error);
    return false;
  }
  return true;
};


/**
 * To Handle relevant log events of transactions
 * @param {Array} decodedTransactionArray - Decoded Logs Array
 */
TransactionLogProcessor.prototype.insertRegisteredBrandedTokens = async function (decodedTransactionArray) {
  const oThis = this;
  const promiseArray = [];
  const brandedTokenAddress = [];
  const brandedTokenDetailsArray = [];
  const addressObject = new AddressKlass(oThis.chainId);

  for (let ind in decodedTransactionArray) {
    const transaction = decodedTransactionArray[ind];
    const blockTimestamp = transaction.timestamp;
    const registerEventArray = transaction.logs['RegisteredBrandedToken'];
    for (let no in registerEventArray) {
      const registerEvent = registerEventArray[no];
      logger.info("TransactionLogProcessor :: insertRegisteredBrandedTokens");
      registerEvent._token = registerEvent._token.toLowerCase();
      registerEvent.timestamp = blockTimestamp;
      brandedTokenAddress.push([registerEvent._token, addressObject.invertedAddressTypes[addressConst.erc20Address]]);
      brandedTokenDetailsArray.push(registerEvent);
    }
  }

  if (brandedTokenAddress.length <= 0) return true;

  const addressIdHash = {};
  let offset = 0;
  try {
    while (true) {
      const addressSubArray = brandedTokenAddress.slice(offset, offset + TX_INSERT_BATCH_SIZE);
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
    logger.error("TransactionLogProcessor :: insertRegisteredBrandedTokens :: brandedTokenAddress :: try catch :: ", err);
    return Promise.reject(err);
  }


  //Creating Formatted Array
  const formattedBrandedTokenArray = []
    , DEFAULT_ICON = 'token_icon_0'
  ;
  for (let ind in brandedTokenDetailsArray) {
    const brandedTokenDetails = brandedTokenDetailsArray[ind];
    const dataRow = [];
    dataRow.push(brandedTokenDetails._name);
    dataRow.push(addressIdHash[brandedTokenDetails._token]);
    dataRow.push(brandedTokenDetails._symbol);
    dataRow.push(brandedTokenDetails._uuid);
    dataRow.push(
      (TokenUnits.toBigNumber(brandedTokenDetails._conversionRate))
        .div(TokenUnits.convertToBigNumber(10).toPower(brandedTokenDetails._conversionRateDecimals)).toString(10));
    dataRow.push(DEFAULT_ICON);
    dataRow.push(brandedTokenDetails.timestamp);
    formattedBrandedTokenArray.push(dataRow);
  }

  return await new BrandedTokenKlass(oThis.chainId).insertMultiple(BrandedTokenKlass.DATA_SEQUENCE_ARRAY, formattedBrandedTokenArray)
    .onDuplicate('branded_tokens.symbol=VALUES(branded_tokens.symbol), branded_tokens.uuid=VALUES(branded_tokens.uuid), ' +
      'branded_tokens.conversion_rate=VALUES(branded_tokens.conversion_rate), branded_tokens.symbol_icon=VALUES(branded_tokens.symbol_icon)').fire()
    .then(function (res) {
      logger.log("Inserting Branded Token Details into DB complete");
      return true;
    })
    .catch(function(err){
      logger.error("block_fetcher :: writeBlocksToDB :: insertMultiple :: ", err);
      return false;
    })

};

/**
 * Format transfer data
 * @param decodedTransactionLogArray
 */
TransactionLogProcessor.prototype.formatTransferData = function (decodedTransactionLogArray) {
  const oThis = this
    , transferArray = [];

  for (let ind in decodedTransactionLogArray) {
    const txn = decodedTransactionLogArray[ind];
    for (let no in txn.logs['Transfer']) {
      const transfer = txn.logs['Transfer'][no];
      const formattedTxn = [];
      formattedTxn.push(oThis.transactionHashId[txn.hash]);
      formattedTxn.push(txn.blockNumber);
      formattedTxn.push(oThis.addressHashId[transfer.address]);
      formattedTxn.push(oThis.addressHashId[transfer._from]);
      formattedTxn.push(oThis.addressHashId[transfer._to]);
      formattedTxn.push(transfer._value);
      formattedTxn.push(txn.timestamp);

      // logger.log('DEBUG...', JSON.stringify(transfer) , JSON.stringify(transfer.address), JSON.stringify(oThis.addressHashId[transfer.address]));
      transferArray.push(formattedTxn);
    }
  }

  return transferArray;
};

/**
 * Formate address transfer data
 * @param decodedTransactionLogArray
 * @param txnIdHash
 * @param addressIdHash
 */
TransactionLogProcessor.prototype.formatAddressTransferData = function (decodedTransactionLogArray) {
  const oThis = this
    , addressTransferArray = []
  ;

  for (let ind in decodedTransactionLogArray) {
    const txn = decodedTransactionLogArray[ind];

    for (let no in txn.logs['Transfer']) {
      const transfer = txn.logs['Transfer'][no];
      const addressTxnFirst = [];
      const addressTxnSecond = [];

      addressTxnFirst.push(oThis.addressHashId[transfer._from]);
      addressTxnSecond.push(oThis.addressHashId[transfer._to]);

      addressTxnFirst.push(oThis.addressHashId[transfer._from]);
      addressTxnSecond.push(oThis.addressHashId[transfer._to]);

      addressTxnFirst.push(oThis.transactionHashId[txn.hash]);
      addressTxnSecond.push(oThis.transactionHashId[txn.hash]);

      addressTxnFirst.push(oThis.addressHashId[transfer.address]);
      addressTxnSecond.push(oThis.addressHashId[transfer.address]);

      addressTxnFirst.push(transfer._value);
      addressTxnSecond.push(transfer._value);

      addressTxnFirst.push(0);
      addressTxnSecond.push(1);

      addressTxnFirst.push(txn.timestamp);
      addressTxnSecond.push(txn.timestamp);

      //Push address transactions
      addressTransferArray.push(addressTxnFirst);
      addressTransferArray.push(addressTxnSecond);
    }
  }

  return addressTransferArray;

};

/**
 * Process transfers to replace address and hashes with ids
 * @param {Array} decodedTransactionLogArray Decoded logs Array
 * @returns {Promise<*>}
 */
TransactionLogProcessor.prototype.processTransfersWithIds = async function (decodedTransactionLogArray) {
  const oThis = this;

  const formattedTransferDataArray = oThis.formatTransferData(decodedTransactionLogArray);

  const formattedAddressTransferDataArray = oThis.formatAddressTransferData(decodedTransactionLogArray);

  // console.log("FORMATTED",formattedTransactionDataArray, formattedExtendedTransactionDataArray, formattedAddressTransactionDataArray);

  return { formattedTransferArray: formattedTransferDataArray
    , formattedAddrTransferArray : formattedAddressTransferDataArray};
};

/**
 * Insert all the processed Transfer Array
 * @param processedTransferArray Processed Transaction Array
 * @returns {Promise<*>}
 */
TransactionLogProcessor.prototype.insertTokenTransfers = async function (processedTransferArray) {
  const oThis = this
    , formattedTransferArray = processedTransferArray.formattedTransferArray
    , formattedAddrTransferArray = processedTransferArray.formattedAddrTransferArray
  ;

  let offset = 0;
  try {
    while (true) {
      const transferArray = formattedTransferArray.slice(offset, offset + TX_INSERT_BATCH_SIZE);
      if (transferArray.length <= 0) {
        break;
      }

      await new TokenTransferKlass(oThis.chainId).insertMultiple(TokenTransferKlass.DATA_SEQUENCE_ARRAY, transferArray, {insertWithIgnore: true}).fire();

      offset += TX_INSERT_BATCH_SIZE;
    }
  } catch (err) {
    logger.error("TransactionLogProcessor :: insertTokenTransfers :: formattedTransferArray :: try catch :: ", err);
    return Promise.reject(err);
  }

  offset = 0;
  try {
    while (true) {
      const addTransferArray = formattedAddrTransferArray.slice(offset, offset + TX_INSERT_BATCH_SIZE);
      if (addTransferArray.length <= 0) {
        break;
      }

      await new AddressTokenTransferKlass(oThis.chainId).insertMultiple(AddressTokenTransferKlass.DATA_SEQUENCE_ARRAY, addTransferArray, {insertWithIgnore: true}).fire();

      offset += TX_INSERT_BATCH_SIZE;
    }
  } catch (err) {
    logger.error("TransactionLogProcessor :: insertTokenTransfers :: formattedAddrTransferArray ::try catch :: ", err);
    return Promise.reject(err);
  }

  return Promise.resolve(processedTransferArray);
};


module.exports = {

  //mock instance
  instance: null,

  newInstance: function (chainId) {
    return this.instance || new TransactionLogProcessor(chainId);
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