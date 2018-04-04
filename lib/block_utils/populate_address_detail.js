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
  , AddressKlass = require(rootPrefix + "/app/models/address")
  , CronDetailKlass = require(rootPrefix + "/app/models/cron_detail")
  , TokenUnits = require(rootPrefix + "/helpers/tokenUnits")
  , Web3Interact = require(rootPrefix + "/lib/web3/interact/rpc_interact")
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
 * @return {null}
 */
PopulateAddressDetail.prototype.process = function (blockNumber, startTransactionIndex) {
  const oThis = this
  ;

  logger.info("\n\n *** PopulateAddressDetail process *** \n\n blockNumber - ", blockNumber, " startTransactionIndex- ", startTransactionIndex);
  oThis.blockNumber = blockNumber;
  oThis.startTransactionIndex = startTransactionIndex;

  return oThis.getAllTransactionsAndTokenTransfers();

  // TODO:: check geth balance for 0 for OST PRIME
  // TODO: THROW WORKS and catch works on it

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
      .where(['transaction_index >= ? & transaction_index < ?', minTransactionIndex, minTransactionIndex + BATCH_SIZE])
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
      let batchedData = oThis.processData(allTransactions, allTokenTransfers);
      batchedData = await oThis.getBalanceFromGeth(batchedData);
      let formattedRowArray = oThis.formatData(batchedData);
      await oThis.insertUpdateAddressDetail(formattedRowArray);
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
    , successTransactionStatus =  new TransactionKlass(oThis.chainId).invertedStatuses[transactionConst.succeeded]
    , data = {}
  ;
  logger.info("** processing data **");

  for (let transactionHashId in allTransactions) {
    const txn = allTransactions[transactionHashId]
      , tokenTransferTxns = allTokenTransfers[transactionHashId] || []
    ;


    if (txn.status !== successTransactionStatus && tokenTransferTxns.length > 0) {
      logger.notify("pad_pd_2", "PopulateAddressDetail processData failed transaction has events",
        {
          transactionHashId: transactionHashId,
          txn: txn,
          tokenTransferTxns: tokenTransferTxns
        });
      throw 'UNEXPECTED TRANSACTION FOUND'
    }


    let lastContractAddressId = null;

    for (let i = 0; i < tokenTransferTxns.length; i++) {
      const tokenTransfer = tokenTransferTxns[i]
        , tokenTransferFromAddressId = tokenTransfer.from_address_id
        , tokenTransferToAddressId = tokenTransfer.to_address_id
        , contractAddressId = tokenTransfer.contract_address_id
      ;

      if (data[tokenTransferFromAddressId]) {
        data[tokenTransferFromAddressId] = {};
      }

      if (data[tokenTransferFromAddressId][contractAddressId]) {
        data[tokenTransferFromAddressId][contractAddressId] = Object.assign({}, DEFAULT_DATA_FOR_ADDRESSES);
      }

      if (data[tokenTransferToAddressId]) {
        data[tokenTransferToAddressId] = {};
      }
      if (data[tokenTransferToAddressId][contractAddressId]) {
        data[tokenTransferToAddressId][contractAddressId] = Object.assign({}, DEFAULT_DATA_FOR_ADDRESSES);
      }

      let fromObj = data[tokenTransferFromAddressId][contractAddressId];
      fromObj.tokens_spent = TokenUnits.add(fromObj.tokens_spent, tokenTransfer.tokens);
      fromObj.total_token_transfers = TokenUnits.add(fromObj.total_token_transfers, 1);

      let toObj = data[tokenTransferToAddressId][contractAddressId];
      toObj.tokens_earned = TokenUnits.add(toObj.tokens_earned, tokenTransfer.tokens);
      toObj.total_token_transfers = TokenUnits.add(toObj.total_token_transfers, 1);

      if (!contractAddressId || (lastContractAddressId && lastContractAddressId !== contractAddressId)) {
        logger.notify("pad_pd_1", "PopulateAddressDetail processData error transactions. check scenario",
          {
            contractAddressId: contractAddressId,
            lastContractAddressId: lastContractAddressId,
            transactionHashId: transactionHashId
          });

      }
      lastContractAddressId = contractAddressId;

    }

    const fromAddressId = txn.from_address_id
      , toAddressId = txn.to_address_id
    ;

    if (data[fromAddressId]) {
      data[fromAddressId] = {0: Object.assign({}, DEFAULT_DATA_FOR_ADDRESSES)};
    }

    var gasUsed = TokenUnits.mul(txn.gas_used, txn.gas_price);
    data[fromAddressId]['0'].gas_spent = TokenUnits.add(data[fromAddressId]['0'].gas_spent, gasUsed);

    if (txn.status === successTransactionStatus) {
      data[fromAddressId]['0'].tokens_spent = TokenUnits.add(data[fromAddressId]['0'].tokens_spent, txn.tokens);
      data[fromAddressId]['0'].total_transactions = TokenUnits.add(data[fromAddressId]['0'].total_transactions, 1);
    }

    if (toAddressId) {
      if (data[toAddressId]) {
        data[toAddressId] = {0: Object.assign({}, DEFAULT_DATA_FOR_ADDRESSES)};
      }

      if (txn.status === successTransactionStatus) {
        data[toAddressId]['0'].tokens_earned = TokenUnits.add(data[toAddressId]['0'].tokens_earned, txn.tokens);
        data[toAddressId]['0'].total_transactions = TokenUnits.add(data[toAddressId]['0'].total_transactions, 1);
      }
    }

  }

  return data;
};

PopulateAddressDetail.prototype.getBalanceFromGeth = async function (batchedData) {

  const oThis = this
    , paramsData = []
    , contractAddressIdsHash = {}
  ;

  logger.info("** fetching balance from geth **");

  for (let key in data) {
    for (let subKey in data[key]) {
      paramsData.push([key, subKey]);
      contractAddressIdsHash[subKey] = null;
    }
  }

  const contractAddressIds = Object.keys(contractAddressIdsHash)
    , addressObj = new AddressKlass(oThis.chainId)
  ;

  const selectAddressHashesResponse = await addressObj.select(['id', 'address_hash']).where({id: contractAddressIds}).fire();

  for (let i = 0; i < selectAddressHashesResponse.length; i++) {
    let element = selectAddressHashesResponse[i]
      , addressId = element.id
      , addressHash = element.address_hash
    ;

    contractAddressIdsHash[addressId] = addressHash;
  }

  const promiseArray = []
  ;

  for (let i = 0; i < paramsData.length; i++) {
    let element = paramsData[i]
      , contractAddress = contractAddressIdsHash[element[1]] // 0 is null ??? is ok??
    ;
    promiseArray.push(oThis.web3Interact.getBalance(element[0], contractAddress));
  }

  const web3Data = await Promise.all(promiseArray);

  for (let i = 0; i < paramsData.length; i++) {
    let element = paramsData[i];
    batchedData[element[0]][element[1]].tokens = web3Data[i].weiBalance;
  }

  return Promise.resolve(batchedData);
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
      row.push(obj.tokens);
      row.push(obj.tokens_earned);
      row.push(obj.tokens_spent);
      row.push(obj.gas_spent);
      row.push(obj.total_transactions);
      row.push(obj.total_token_transfers);
      formattedRows.push(row);
    });
  });

  return formattedRows;
};

PopulateAddressDetail.prototype.insertUpdateAddressDetail = function (data) {
  const oThis = this
    , addressDetailObj = AddressDetailKlass(oThis.chainId);
  ;
  logger.info("** insert/update address details **");

  return addressDetailObj.insertMultiple(['address_id', 'contract_address_id', 'tokens', 'tokens_earned', 'tokens_spent', 'gas_spent', 'total_transactions', 'total_token_transfers'], data)
    .onDuplicate({
        tokens: 'VALUES(tokens)',
        tokens_earned: 'tokens_earned + VALUES(tokens_earned)',
        tokens_spent: 'tokens_spent + VALUES(tokens_spent)',
        gas_spent: 'gas_spent + VALUES(gas_spent)',
        total_transactions: 'total_transactions + VALUES(total_transactions)',
        total_token_transfers: 'total_token_transfers + VALUES(total_token_transfers)',
        updated_at: new Date()
      }
    ).fire()
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

module.exports = {
  newInstance: function (chainId) {
    return new PopulateAddressDetail(chainId);
  }
};