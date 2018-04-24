"use strict";

/**
 * Aggregate Data for branded token transactions starting from given timestamp
 *
 * @module lib/block_utils/aggregate_data
 */
const rootPrefix = "../.."
  , Web3Interact = require(rootPrefix + "/lib/web3/interact/rpc_interact")
  , AggregatedDataModelKlass = require(rootPrefix + '/app/models/aggregated')
  , logger = require(rootPrefix + "/helpers/custom_console_logger")
  , constants = require(rootPrefix + "/config/core_constants")
  , TransactionModelKlass = require(rootPrefix + '/app/models/transaction')
  , TransactionHashModelKlass = require(rootPrefix + '/app/models/transaction_hash')
  , TokenTransfersModelKlass = require(rootPrefix + '/app/models/token_transfer')
  , AddressDetailsModelKlass = require(rootPrefix + '/app/models/address_detail')
  , BrandedTokenStatsKlass = require(rootPrefix + '/app/models/branded_token_stats')
  , BrandedTokenCacheKlass = require(rootPrefix + '/lib/cache_multi_management/branded_tokens')
  , BrandedTokenStatsCacheKlass = require(rootPrefix + '/lib/cache_multi_management/branded_token_stats')
  , TokenUnits = require(rootPrefix + "/helpers/tokenUnits")
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , HomePageStatsCacheKlass = require(rootPrefix + "/lib/cache_management/home_page_stats")
  , TopTokensCacheKlass = require(rootPrefix + "/lib/cache_management/top_tokens")
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

let startTime = 0;

const BATCH_SIZE = 400;

AggregateData.prototype = {

  /**
   * Perform branded token transactions aggregation
   *
   * @return {Promise<void>}
   */
  perform: async function(){
    const oThis = this;

    startTime = Date.now();

    let allTransactions = {}
      , tokenTransfersHash = {}
      , transactionTypeHash = {}
      , contractAddresses = {}
      ;

    let batchSize = BATCH_SIZE
      , batchNo = 1
      ;

    while(true) {
      const offset = (batchNo - 1) * batchSize
      ;

      batchNo ++;

      var response = await oThis.fetchTransactionsAndTransfers(batchSize, offset);

      if (response.isFailure()){
        break;
      }
      const responseData = response.data;
      Object.assign(allTransactions, responseData.transactions);
      Object.assign(tokenTransfersHash, responseData.token_transfers);
      Object.assign(transactionTypeHash, responseData.transaction_types);
      Object.assign(contractAddresses, responseData.contract_addresses);
    }

    const diffTime = Date.now() - startTime;
    logger.info('aggregate_data : fetchTransactionsAndTransfers : took ',diffTime, 'milli');

    if(Object.keys(allTransactions).length < 1){
      logger.log("No transactions found in given timeFrame, Start timestamp: " + oThis.startTimestamp);
     // process.exit(1);
    } else {

        await oThis.aggregateAndInsert(allTransactions, tokenTransfersHash, transactionTypeHash, Object.keys(contractAddresses));

        // Clear home page stats cache and top tokens cache
        new HomePageStatsCacheKlass({chain_id: oThis.chainId}).clear();
        new TopTokensCacheKlass({chain_id: oThis.chainId}).clear();

        logger.log("Aggregation flow complete for timeFrame, Start timestamp: " + oThis.startTimestamp);
        logger.info('aggregate_data : aggregateAndInsert : took ', Date.now() - startTime, 'milli from start');
    }

    return Promise.resolve(responseHelper.successWithData({startTime: oThis.startTimestamp, endTime: oThis.endTimestamp}));
  },

  /**
   * Fetch transactions in batches for given timeFrame
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

    const transactions = await new TransactionModelKlass(oThis.chainId).select('id, transaction_hash_id, tokens')
      .where(['block_timestamp >= ? AND block_timestamp < ?', oThis.startTimestamp, oThis.endTimestamp])
      .limit(batchSize).offset(offset)
      .fire();

    if(transactions.length === 0){
      return Promise.resolve(responseHelper.error("bu_ad_1", "Transactions not found."))
    }

    // Collect all transactions
    for(var i = 0; i < transactions.length; i++) {
      const trxRecord = transactions[i];
      trxHashIds.push(trxRecord.transaction_hash_id);
      transactionsHash[trxRecord.transaction_hash_id] = trxRecord;
    }

    // Fetch transaction types for given transactions
    const transactionHashes = await new TransactionHashModelKlass(oThis.chainId).select('*').where(['id IN (?)', trxHashIds]).fire();
    if(transactionHashes.length != trxHashIds.length){
      //Need to set up the cron again.
      // TODO:: Whether this rare condition should block the cron execution before manual intervention or keep on failing every minute?
      logger.error("Transaction Hashes not present for some transactions.");
      process.exit(1);
    }
    for(let i = 0; i < transactionHashes.length; i++) {
      const trxHashRecord = transactionHashes[i];
      transactionTypeHash[trxHashRecord.id] = trxHashRecord.branded_token_transaction_type_id;
    }

    // Fetch token transfers for given transactions
    const tokenTransfers = await new TokenTransfersModelKlass(oThis.chainId).select('id, transaction_hash_id, contract_address_id, tokens').
      where(['transaction_hash_id IN (?)', trxHashIds]).fire();
    // Map all token transfers with a transaction hash
    for(let i = 0; i < tokenTransfers.length; i++) {
      const ttRecord = tokenTransfers[i];
      tokenTransfersHash[ttRecord.transaction_hash_id] = tokenTransfersHash[ttRecord.transaction_hash_id] || [];
      tokenTransfersHash[ttRecord.transaction_hash_id].push(ttRecord);
      contractAddressMap[ttRecord.contract_address_id] = contractAddressMap[ttRecord.contract_address_id] || 1;
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
   * @param contractAddressIds - [Contract Address Ids]
   *
   * @return {Promise<void>}
   */
  aggregateAndInsert: async function(allTransactions, tokenTransfersHash, transactionTypeHash, contractAddresses){
    const oThis = this;

    let brandedTokenMap = {}
      , brandedTokensCache = await new BrandedTokenCacheKlass({chain_id: oThis.chainId, contract_address_ids: contractAddresses}).fetch()
      , aggregateData = {}
      , brandedTokenAggData = {}
    ;

    const brandedTokens = brandedTokensCache.data;

    // Aggregate Data to insert in table
    for(var trxHashId in allTransactions){
      let trxRecord = allTransactions[trxHashId]
        , btId = 0;

      // If token transfers is present for a transaction hash then contract address would be taken from token transfers
      if(tokenTransfersHash[trxHashId]){
        btId = tokenTransfersHash[trxHashId][0].contract_address_id;
      }

      let txTypeId = transactionTypeHash[trxHashId]
        , contractInfo = brandedTokens[btId] || {}
        , ostToBtConversationFactor = contractInfo.conversion_rate || 0
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

      brandedTokenAggData[btId] = brandedTokenAggData[btId] ||
        {token_transfers: 0, token_transfer_value: 0, token_ost_volume: 0,
          contract_address: contractInfo.contract_address, price: ostToBtConversationFactor};

      // Token transfers data to aggregate
      if(tokenTransfersHash[trxHashId]){
        var btdObj = brandedTokenAggData[btId];
        for(var i=0;i<tokenTransfersHash[trxHashId].length;i++){
          txObj.total_transfers = TokenUnits.add(txObj.total_transfers, 1);
          txObj.total_transfer_value = TokenUnits.add(txObj.total_transfer_value, tokenTransfersHash[trxHashId][i].tokens);
          txObj.token_ost_volume = TokenUnits.div(txObj.total_transfer_value, ostToBtConversationFactor);

          btdObj.token_transfers = TokenUnits.add(btdObj.token_transfers, 1);
          btdObj.token_transfer_value = TokenUnits.add(btdObj.token_transfer_value, tokenTransfersHash[trxHashId][i].tokens);
          btdObj.token_ost_volume = TokenUnits.div(btdObj.token_transfer_value, ostToBtConversationFactor);
        }
      }
    }
    try {

      if (Object.keys(aggregateData).length === 0) {
        logger.log("Aggregated data could not be generated for given timeframe, Start timestamp: " + oThis.startTimestamp);
        return Promise.resolve(responseHelper.successWithData({}));
      }

      await oThis.insertIntoAggregateTable(aggregateData);

      await oThis.updateBrandedTokenStats(brandedTokenAggData);
    }
    catch (err) {
      logger.error("aggregate data :: aggregateAndInsert", err);
    }
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
      , batchSize = BATCH_SIZE;
    while (true) {
      const insertAggArray = dataToInsert.slice(offset, offset + batchSize);
      if (insertAggArray.length <= 0) {break;}

      await new AggregatedDataModelKlass(oThis.chainId).insertMultiple(AggregatedDataModelKlass.DATA_SEQUENCE_ARRAY, insertAggArray).fire();

      offset += batchSize;
    }
  },

  /**
   * Update branded token stats
   *
   * @param brandedTokenAggData
   * @return {Promise<void>}
   */
  updateBrandedTokenStats: async function(brandedTokenAggData){
    const oThis = this;

    const tokenCirculations = await new AddressDetailsModelKlass(oThis.chainId).selectTotalTokenDetails(Object.keys(brandedTokenAggData));

    let dataToInsert = [];
    for(var btId in brandedTokenAggData){
      if(btId <= 0){continue;}
      var btdObj = brandedTokenAggData[btId];

      btdObj['total_supply'] = await oThis.getTokenTotalSupply(btdObj.contract_address);
      btdObj['market_cap'] = TokenUnits.toBigNumber(btdObj.total_supply).div(TokenUnits.toBigNumber(btdObj.price)).toString(10);

      let tc = tokenCirculations[btId] || {};
      dataToInsert.push([btId, (tc.total_users || 0), btdObj.token_transfers, btdObj.total_supply,
        btdObj.token_ost_volume, btdObj.market_cap, (tc.total_tokens || 0)])
    }

    if(dataToInsert.length > 0) {
      await new BrandedTokenStatsKlass(oThis.chainId).insertMultiple(BrandedTokenStatsKlass.DATA_SEQUENCE_ARRAY, dataToInsert)
        .onDuplicate('token_holders=VALUES(token_holders), ' +
          'token_transfers=token_transfers + VALUES(token_transfers), total_supply=VALUES(total_supply), ' +
          'token_ost_volume=token_ost_volume+VALUES(token_ost_volume), market_cap=VALUES(market_cap), circulation=VALUES(circulation)').fire();
      new BrandedTokenStatsCacheKlass({contract_address_ids: Object.keys(brandedTokenAggData), chain_id: oThis.chainId}).clear();
    }
  },

  /**
   * Get total supply of tokens for given contract address
   *
   * @param contractAddress
   * @return {Promise<T>}
   */
  getTokenTotalSupply: async function(contractAddress){
    const oThis = this;

    let web3Interact = Web3Interact.getInstance(oThis.chainId);

    let tokenSupply = web3Interact.getTotalSupply(String(contractAddress))
      .then(function(totalSupply){
        return totalSupply;
      })
      .catch(function (err) {
        logger.notify('l_bu_ad_gtts_1', 'error in getting token supply for contractAddress : '+contractAddress , err);
        return 0;
      });

    return tokenSupply;
  }
};

module.exports = {
  newInstance: function (chainId, timestamp) {
    return new AggregateData(chainId, timestamp);
  }
};