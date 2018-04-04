"use strict";

/**
 * Aggregate Data for branded token transactions starting from given timestamp
 *
 * @module lib/block_utils/aggregate_data
 */
const rootPrefix = "../.."
  , AggregatedDataModelKlass = require(rootPrefix + '/app/models/aggregated')
  , logger = require(rootPrefix + "/helpers/custom_console_logger")
  , constants = require(rootPrefix + "/config/core_constants")
  , TransactionModelKlass = require(rootPrefix + '/app/models/transaction')
  , TransactionHashModelKlass = require(rootPrefix + '/app/models/transaction_hash')
  , TokenTransfersModelKlass = require(rootPrefix + '/app/models/token_transfer')
  , BrandedTokenCacheKlass = require(rootPrefix + '/lib/cache_multi_management/branded_tokens')
  , TokenUnits = require(rootPrefix + "/helpers/tokenUnits")
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  ;

/**
 * Aggregate Data for branded token transactions starting from given timestamp for a chain.
 *
 * @param chainId
 * @param timestamp
 * @constructor
 */
const AggregateData = function(chainId, timestamp){
  const oThis = this;

  oThis.startTimestamp = timestamp;
  oThis.endTimestamp = timestamp + constants.AGGREGATE_CONSTANT;
  oThis.chainId = chainId;
};

AggregateData.prototype = {

  /**
   * Perform branded token transactions aggregation
   *
   * @return {Promise<void>}
   */
  perform: async function(){
    const oThis = this;

    let allTransactions = {}
      , tokenTransfersHash = {}
      , transactionTypeHash = {}
      , contractAddresses = {}
      ;

    let batchSize = 100
      , batchNo = 1
      ;


    while(true){
      const offset = (batchNo - 1) * batchSize
        , batchedTransactionHashIds = []
      ;

      batchNo ++;

      var response = await oThis.fetchTransactionsAndTransfers(batchSize, offset);

      if(response.isFailure()){
        break;
      }
      const responseData = response.data;
      Object.assign(allTransactions, responseData.transactions);
      Object.assign(tokenTransfersHash, responseData.token_transfers);
      Object.assign(transactionTypeHash, responseData.transaction_types);
      Object.assign(contractAddresses, responseData.contract_addresses);
    }

    if(Object.keys(allTransactions).length === 0){
      logger.log("No transactions found in given timeframe, Start timestamp: " + oThis.startTimestamp);
      process.exit(1);
    }

    await oThis.aggregateAndInsert(allTransactions, tokenTransfersHash, transactionTypeHash, Object.keys(contractAddresses));
    logger.log("Aggregation flow complete for timeframe, Start timestamp: " + oThis.startTimestamp);
    process.exit(1);
  },

  /**
   * Fetch transactions in batches for given timeframe
   *
   * @return {Promise<void>}
   */
  fetchTransactionsAndTransfers: async function(batchSize, offset){
    const oThis = this;

    let trxHashIds = []
      , transactionsHash = {}
      , tokenTransfersHash = {}
      , transactionTypeHash = {}
      , contractAddressMap = {}
      ;

    const transactions = await new TransactionModelKlass(oThis.chainId).select('id, transaction_hash_id, contract_address_id, tokens').
      where(['block_timestamp >= ? AND block_timestamp < ?', oThis.startTimestamp, oThis.endTimestamp]).
      limit(batchSize).offset(offset).fire();

    console.log("transactions", transactions);
    if(transactions.length === 0){
      return Promise.resolve(responseHelper.error("bu_ad_1", "Transactions not found."))
    }

    // Collect all transactions
    for(var i = 0; i < transactions.length; i++) {
      const trxRecord = transactions[i];
      trxHashIds.push(trxRecord.transaction_hash_id);
      transactionsHash[trxRecord.transaction_hash_id] = trxRecord;
      contractAddressMap[trxRecord.contract_address_id] = contractAddressMap[trxRecord.contract_address_id] || 1;
    }

    // Fetch transaction types for given transactions
    const transactionHashes = await new TransactionHashModelKlass(oThis.chainId).select('*').where(['id IN (?)', trxHashIds]).fire();
    if(transactionHashes.length != trxHashIds.length){
      //Need to set up the cron again.
      logger.error("Transaction Hashes not present for some transactions.");
      process.exit(1);
    }
    for(var i = 0; i < transactionHashes.length; i++) {
      const trxHashRecord = transactionHashes[i];
      transactionTypeHash[trxHashRecord.id] = trxHashRecord.branded_token_transaction_type_id;
    }

    // Fetch token transfers for given transactions
    const tokenTransfers = await new TokenTransfersModelKlass(oThis.chainId).select('id, transaction_hash_id, contract_address_id, tokens').
      where(['transaction_hash_id IN (?)', trxHashIds]).fire();
    // Map all token transfers with a transaction hash
    for(var i = 0; i < tokenTransfers.length; i++) {
      const ttRecord = tokenTransfers[i];
      tokenTransfersHash[ttRecord.transaction_hash_id] = tokenTransfersHash[ttRecord.transaction_hash_id] || [];
      tokenTransfersHash[ttRecord.transaction_hash_id].push(ttRecord);
    }

    return Promise.resolve(responseHelper.successWithData({transactions: transactionsHash,
      transaction_types: transactionTypeHash, token_transfers: tokenTransfersHash, contract_addresses: contractAddressMap}));
  },

  /**
   * Aggregate Data for all transactions in timeframe and insert in aggregate table
   *
   * @param allTransactions - {transaction_hash_id => transaction record }
   * @param tokenTransfersHash - {transaction_hash_id => [Token transfers records] }
   * @param transactionTypeHash - {transaction_hash_id => Branded token transaction type}
   * @param contractAddresses - [Contract Address Ids]
   *
   * @return {Promise<void>}
   */
  aggregateAndInsert: async function(allTransactions, tokenTransfersHash, transactionTypeHash, contractAddresses){
    const oThis = this;

    let brandedTokenMap = {}
      , brandedTokensCache = await new BrandedTokenCacheKlass({chain_id: oThis.chainId, contract_address_ids: contractAddresses}).fetch()
      , aggregateData = {}
      ;

    if(brandedTokensCache.isFailure()){
      logger.error("Branded Tokens not found");
      process.exit(1);
    }

    const brandedTokens = brandedTokensCache.data;

    // Aggregate Data to insert in table
    for(var trxHashId in allTransactions){
      var trxRecord = allTransactions[trxHashId]
        , btId = trxRecord.contract_address_id
        , txTypeId = transactionTypeHash[trxHashId]
        , contractInfo = brandedTokens[btId] || {}
        , ostToBtConversationFactor = contractInfo.price || 0
        ;

      aggregateData[btId] = aggregateData[btId] || {};
      aggregateData[btId][txTypeId] = aggregateData[btId][txTypeId] || {
        total_transactions: 0,
        total_transaction_value: 0,
        total_transfers: 0,
        total_transfer_value: 0,
        token_ost_volume: 0
      };

      var txObj = aggregateData[btId][txTypeId];
      txObj.total_transactions = TokenUnits.add(txObj.total_transactions, 1);
      txObj.total_transaction_value = TokenUnits.add(txObj.total_transaction_value, trxRecord.tokens);

      // Token transfers data to aggregate
      if(tokenTransfersHash[trxHashId]){
        for(var i=0;i<tokenTransfersHash[trxHashId].length;i++){
          console.log("tokenTransfersHash[trxHashId][i].tokens"+ JSON.stringify(tokenTransfersHash[trxHashId][i].tokens));
          txObj.total_transfers = TokenUnits.add(txObj.total_transfers, 1);
          txObj.total_transfer_value = TokenUnits.add(txObj.total_transfer_value, tokenTransfersHash[trxHashId][i].tokens);
          console.log("total_transfer_value"+ txObj.total_transfer_value);
          txObj.token_ost_volume = TokenUnits.mul(txObj.total_transfer_value, ostToBtConversationFactor);
        }
      }
    }

    if(Object.keys(aggregateData).length === 0){
      logger.log("Aggregated data could not be generated for given timeframe, Start timestamp: " + oThis.startTimestamp);
      process.exit(1);
    }

    await oThis.insertIntoAggregateTable(aggregateData);
  },

  /**
   * Insert aggregated data to table
   *
   * @param aggregateData
   * @return {Promise<void>}
   */
  insertIntoAggregateTable: async function(aggregateData){
    const oThis = this;

    let dataToInsert = [];

    for(var btId in aggregateData){
      for(var trTypeId in aggregateData[btId]){
        var rowData = aggregateData[btId][trTypeId];
        dataToInsert.push([btId, trTypeId, oThis.startTimestamp,
          rowData.total_transactions, rowData.total_transaction_value, rowData.total_transfers,
          rowData.total_transfer_value, rowData.token_ost_volume]);
      }
    }

    // Insert Data in batches
    let offset  = 0
      , batchSize = 100;
    while (true) {
      const insertArray = dataToInsert.slice(offset, offset + batchSize);
      if (insertArray.length <= 0) {break;}

      await new AggregatedDataModelKlass(oThis.chainId).insertMultiple(AggregatedDataModelKlass.DATA_SEQUENCE_ARRAY, insertArray).fire();

      offset += batchSize;
    }
  }
};

module.exports = {
  newInstance: function (chainId, timestamp) {
    return new AggregateData(chainId, timestamp);
  }
};