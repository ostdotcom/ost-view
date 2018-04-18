"use strict";
/**
 * Aggregate Data
 *
 * @module lib/block_utils/populate_address_detail
 */
const rootPrefix = "../.."
  , logger = require(rootPrefix + "/helpers/custom_console_logger")
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , TransactionKlass = require(rootPrefix + "/app/models/transaction")
  , transactionConst = require(rootPrefix + '/lib/global_constant/transaction')
  , TokenTransferKlass = require(rootPrefix + "/app/models/token_transfer")
  , AddressDetailKlass = require(rootPrefix + "/app/models/address_detail")
  , AddressesCacheKlass = require(rootPrefix + "/lib/cache_multi_management/addresses")
  , AddressesDetailCacheKlass = require(rootPrefix + "/lib/cache_multi_management/address_details")
  , CronDetailKlass = require(rootPrefix + "/app/models/cron_detail")
  , TokenUnits = require(rootPrefix + "/helpers/tokenUnits")
  , Web3Interact = require(rootPrefix + "/lib/web3/interact/rpc_interact")
  , TopUsersCacheKlass = require(rootPrefix + "/lib/cache_management/top_users")
  , HomePageStatsCacheKlass = require(rootPrefix + "/lib/cache_management/home_page_stats")
;

/**
 * Constructor to create object of PopulateAddressDetail
 *
 * @param {Integer} chainId - chainId of the block chain
 * @constructor
 */
const PopulateAddressDetail = function (chainId) {
  this.chainId = chainId;
  this.web3Interact = Web3Interact.getInstance(chainId);
  this.blockNumber = null;
  this.startTransactionIndex = null;
};

const DEFAULT_DATA_FOR_ADDRESSES = {
  tokens_earned: 0,
  tokens_spent: 0,
  gas_spent: 0,
  total_transactions: 0,
  total_token_transfers: 0
};

const BATCH_SIZE = 100;
/**
 * It gets all the transactions for a block and process it to get transfer details of addresses in batches of 100
 *
 * @param  {Integer} blockNumber - block number to process
 *
 * @return {Promise}
 */
PopulateAddressDetail.prototype.process = function (blockNumber, startTransactionIndex) {
  const oThis = this
  ;

  logger.info("\n\n *** PopulateAddressDetail process *** \n\n blockNumber - ", blockNumber, " startTransactionIndex- ", startTransactionIndex);
  oThis.blockNumber = blockNumber;
  oThis.startTransactionIndex = startTransactionIndex;

  return oThis.getAllTransactionsAndTokenTransfers();
};

PopulateAddressDetail.prototype.getAllTransactionsAndTokenTransfers = async function () {
  const oThis = this
  ;

  var minTransactionIndex = oThis.startTransactionIndex;

  while (true) {
    logger.info("** fetching transactions And token transfers starting from transaction index - ", minTransactionIndex, " **");

    let transactionObj = new TransactionKlass(oThis.chainId)
      , tokenTransferObj = new TokenTransferKlass(oThis.chainId)
      , batchedTransactionHashIds = []
      , allTransactions = {}
      , allTokenTransfers = {}
    ;

    let batchedTransactions = await transactionObj.select().where({block_number: oThis.blockNumber})
      .where(['transaction_index >= ? AND transaction_index < ?', minTransactionIndex, minTransactionIndex + BATCH_SIZE])
      .fire();

    if (batchedTransactions.length === 0) break;

    for (let i = 0; i < batchedTransactions.length; i++) {
      let transactionHashId = batchedTransactions[i].transaction_hash_id;
      batchedTransactionHashIds.push(transactionHashId);
      allTransactions[transactionHashId] = batchedTransactions[i];
    }

    let batchedTokenTransfers = await tokenTransferObj.select().where({transaction_hash_id: batchedTransactionHashIds}).fire();

    for (let i = 0; i < batchedTokenTransfers.length; i++) {
      let transactionHashId = batchedTokenTransfers[i].transaction_hash_id;
      allTokenTransfers[transactionHashId] = allTokenTransfers[transactionHashId] || [];
      allTokenTransfers[transactionHashId].push(batchedTokenTransfers[i]);
    }

    try {
      let responseObj1 = oThis.processData(allTransactions, allTokenTransfers);
      if (responseObj1.isFailure()) return responseObj1;

      let responseObj2 = await oThis.getBalanceFromGeth(responseObj1.data.addressData);
      if (responseObj2.isFailure()) return responseObj2;

      let responseObj3 = oThis.formatData(responseObj2.data.addressData);
      if (responseObj3.isFailure()) return responseObj3;

      await oThis.insertUpdateAddressDetail(responseObj3.data.formattedRows);

      oThis.clearAddressesAndStatsCache(responseObj2.data.addressHashes, responseObj2.data.contractAddresses);
      await oThis.updateCronDetailRow(oThis.blockNumber, minTransactionIndex + BATCH_SIZE);

    } catch (err) {
      logger.notify('pad_gatatt_1', 'error in getAllTransactionsAndTokenTransfers',
        {
          blockNumber: oThis.blockNumber,
          startTransactionIndex: oThis.startTransactionIndex,
          minTransactionIndex: minTransactionIndex,
          err: err
        });

      return responseHelper.error('pad_gatatt_1', 'There was some error in address details population');
    }

    minTransactionIndex = minTransactionIndex + BATCH_SIZE;
  }

  logger.info("** Address Detail popualte complete for block_number-", oThis.blockNumber, " **");

  await oThis.updateCronDetailRow(oThis.blockNumber + 1, 0);
  return responseHelper.successWithData({blockNumber: oThis.blockNumber + 1, startTransactionIndex: 0});
};

PopulateAddressDetail.prototype.processData = function (allTransactions, allTokenTransfers) {
  const oThis = this
    , successTransactionStatus =  Number(new TransactionKlass(oThis.chainId).invertedStatuses[transactionConst.succeeded])
    , addressData = {}
  ;
  logger.info("** processing data **");

  for (let transactionHashId in allTransactions) {
    const txn = allTransactions[transactionHashId]
      , tokenTransferTxns = allTokenTransfers[transactionHashId] || []
    ;

    if (txn.status !== successTransactionStatus && tokenTransferTxns.length > 0) {
      let failedData = {transactionHashId: transactionHashId, txn: txn, tokenTransferTxns: tokenTransferTxns};
      logger.notify("pad_pd_1", "PopulateAddressDetail processData failed transaction has events", failedData);
      return responseHelper.error('pad_pd_1', 'PopulateAddressDetail processData failed transaction has events', failedData);
    }


    let lastContractAddressId = null;

    for (let i = 0; i < tokenTransferTxns.length; i++) {
      const tokenTransfer = tokenTransferTxns[i]
        , tokenTransferFromAddressId = tokenTransfer.from_address_id
        , tokenTransferToAddressId = tokenTransfer.to_address_id
        , contractAddressId = tokenTransfer.contract_address_id
      ;

      if (!addressData[tokenTransferFromAddressId]) {
        addressData[tokenTransferFromAddressId] = {};
      }

      if (!addressData[tokenTransferFromAddressId][contractAddressId]) {
        addressData[tokenTransferFromAddressId][contractAddressId] = Object.assign({}, DEFAULT_DATA_FOR_ADDRESSES);
      }

      if (!addressData[tokenTransferToAddressId]) {
        addressData[tokenTransferToAddressId] = {};
      }
      if (!addressData[tokenTransferToAddressId][contractAddressId]) {
        addressData[tokenTransferToAddressId][contractAddressId] = Object.assign({}, DEFAULT_DATA_FOR_ADDRESSES);
      }

      let fromObj = addressData[tokenTransferFromAddressId][contractAddressId];
      fromObj.tokens_spent = TokenUnits.add(fromObj.tokens_spent, tokenTransfer.tokens);
      fromObj.total_token_transfers = TokenUnits.add(fromObj.total_token_transfers, 1);

      let toObj = addressData[tokenTransferToAddressId][contractAddressId];
      toObj.tokens_earned = TokenUnits.add(toObj.tokens_earned, tokenTransfer.tokens);
      toObj.total_token_transfers = TokenUnits.add(toObj.total_token_transfers, 1);

      if (!contractAddressId || (lastContractAddressId && lastContractAddressId !== contractAddressId)) {

        let failedData =  {contractAddressId: contractAddressId, lastContractAddressId: lastContractAddressId,
          transactionHashId: transactionHashId};

        logger.notify("pad_pd_2", "PopulateAddressDetail processData error transactions. check scenario", failedData);
        return responseHelper.error('pad_pd_2', 'PopulateAddressDetail processData error transactions. check scenario', failedData);
      }

      lastContractAddressId = contractAddressId;
    }

    const fromAddressId = txn.from_address_id
      , toAddressId = txn.to_address_id
    ;

    if (!addressData[fromAddressId]) {
      addressData[fromAddressId] = {}
    }

    if (!addressData[fromAddressId]['0']) {
      addressData[fromAddressId]['0'] = Object.assign({}, DEFAULT_DATA_FOR_ADDRESSES);
    }

    if (toAddressId) {
      if (!addressData[toAddressId]) {
        addressData[toAddressId] = {};
      }

      if (!addressData[toAddressId]['0']) {
        addressData[toAddressId]['0'] = Object.assign({}, DEFAULT_DATA_FOR_ADDRESSES);
      }
    }

    var gasUsed = TokenUnits.mul(txn.gas_used, txn.gas_price);
    addressData[fromAddressId]['0'].gas_spent = TokenUnits.add(addressData[fromAddressId]['0'].gas_spent, gasUsed);

    if (txn.status === successTransactionStatus) {
      addressData[fromAddressId]['0'].tokens_spent = TokenUnits.add(addressData[fromAddressId]['0'].tokens_spent, txn.tokens);
      addressData[fromAddressId]['0'].total_transactions = TokenUnits.add(addressData[fromAddressId]['0'].total_transactions, 1);
    }

    if (toAddressId) {
      if (txn.status === successTransactionStatus) {
        addressData[toAddressId]['0'].tokens_earned = TokenUnits.add(addressData[toAddressId]['0'].tokens_earned, txn.tokens);
        addressData[toAddressId]['0'].total_transactions = TokenUnits.add(addressData[toAddressId]['0'].total_transactions, 1);
      }
    }

  }

  return responseHelper.successWithData({addressData: addressData});
};

PopulateAddressDetail.prototype.getBalanceFromGeth = async function (batchedData) {

  const oThis = this
    , paramsData = []
    , addressIdsHash = {}
    , addressHashesArray = []
    , contractAddresses = []
  ;

  logger.info("** fetching balance from geth **");

  for (let key in batchedData) {
    for (let subKey in batchedData[key]) {
      paramsData.push([key, subKey]);
      addressIdsHash[key] = null;
      addressIdsHash[subKey] = null;
    }
  }

  const addressIds = Object.keys(addressIdsHash)
    , addressCacheResponse = await new AddressesCacheKlass({chain_id: oThis.chainId, ids: addressIds}).fetch()
  ;

  const selectAddressHashesResponse = addressCacheResponse.data;

  for (let key in selectAddressHashesResponse) {
    let element = selectAddressHashesResponse[key]
      , addressId = element.id
      , addressHash = element.address_hash
    ;
    addressIdsHash[addressId] = addressHash;
    addressHashesArray.push(addressHash);
  }

  const promiseArray = [];

  for (let i = 0; i < paramsData.length; i++) {
    let element = paramsData[i]
      , userAddress = addressIdsHash[element[0]]
      , contractAddress = addressIdsHash[element[1]]
    ;
    contractAddresses.push(contractAddress);
    promiseArray.push(oThis.web3Interact.getBalance(userAddress, contractAddress));
  }

  const web3Data = await Promise.all(promiseArray);

  for (let i = 0; i < paramsData.length; i++) {
    let element = paramsData[i];
    let gethResponse = web3Data[i];
    if (gethResponse.isFailure())return Promise.resolve(gethResponse);
    batchedData[element[0]][element[1]].tokens = gethResponse.data.weiBalance;
  }

  return Promise.resolve(responseHelper.successWithData({addressData: batchedData,
    addressHashes: addressHashesArray, contractAddresses: contractAddresses}));
};

/**
 * To format address data
 * @param {Hash} data - data to be formatted
 * @returns {Array} Array of formatted data
 */
PopulateAddressDetail.prototype.formatData = function (data) {
  const oThis = this
    , formattedRows = []
  ;

  logger.info("** formatting data for insertion **");

  Object.keys(data).forEach(function (addressId) {
    var subData = data[addressId];
    Object.keys(subData).forEach(function (contractAddressId) {
      let obj = subData[contractAddressId];
      let row = [];
      row.push(addressId);
      row.push(contractAddressId);
      row.push(obj.tokens.toString(10));
      row.push(obj.tokens_earned);
      row.push(obj.tokens_spent);
      row.push(obj.gas_spent);
      row.push(obj.total_transactions);
      row.push(obj.total_token_transfers);
      formattedRows.push(row);
    });
  });

  return responseHelper.successWithData({formattedRows: formattedRows});
};

PopulateAddressDetail.prototype.insertUpdateAddressDetail = function (data) {
  const oThis = this
    , addressDetailObj = new AddressDetailKlass(oThis.chainId);
  ;
  logger.info("** insert/update address details **");

  return addressDetailObj.insertMultiple(['address_id', 'contract_address_id', 'tokens', 'tokens_earned', 'tokens_spent', 'gas_spent', 'total_transactions', 'total_token_transfers'], data)
    .onDuplicate(["tokens_earned = tokens_earned + VALUES(tokens_earned), tokens = VALUES(tokens), tokens_spent = tokens_spent + VALUES(tokens_spent), gas_spent = gas_spent + VALUES(gas_spent), total_transactions = total_transactions + VALUES(total_transactions), total_token_transfers = total_token_transfers + VALUES(total_token_transfers), updated_at = now()"]
    ).fire();
};

PopulateAddressDetail.prototype.updateCronDetailRow = function (currentBlockNumber, start_from_index) {
  const oThis = this
    , cronDetailObj = new CronDetailKlass(oThis.chainId)
  ;

  logger.info("** update cron detail table row with block_number- ", currentBlockNumber, " start_from_index- ", start_from_index, " **");

  return cronDetailObj.update({
    data: JSON.stringify({block_number: currentBlockNumber, start_from_index: start_from_index})
  }).where({cron_name: CronDetailKlass.address_detail_populate_cron}).fire();

};

PopulateAddressDetail.prototype.clearAddressesAndStatsCache = function(addresses, contractAddresses){
  const oThis = this;
  // Clear address details cache
  new AddressesDetailCacheKlass({chain_id: oThis.chainId, addresses: addresses}).clear();

  // Clear top users cache data for contract addresses
  for(let i=0;i<contractAddresses.length;i++){
    if(!contractAddresses[i]){continue;}
    new TopUsersCacheKlass({chain_id: oThis.chainId, contract_address: contractAddresses[i]}).clear();
  }

  // Clear home page stats
  new HomePageStatsCacheKlass({chain_id: oThis.chainId}).clear();
};

module.exports = {
  newInstance: function (chainId) {
    return new PopulateAddressDetail(chainId);
  }
};