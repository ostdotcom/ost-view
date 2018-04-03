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

const DEFAULT_DATA_FOR_ADDRESSES = {tokens_earned: 0, tokens_spent: 0, total_transactions: 0, total_token_transfers: 0};

/**
 * It gets all the transactions for a block and process it to get transfer details of addresses
 *
 * @param  {Integer} blockNumber - block number to process
 *
 * @return {null}
 */
PopulateAddressDetail.prototype.process =  function (blockNumber, startTransactionIndex) {
  const oThis = this
  ;

  logger.info("** PopulateAddressDetail process blockNumber - ", blockNumber);
  oThis.blockNumber = blockNumber;
  oThis.startTransactionIndex = startTransactionIndex;

  return oThis.getAllTransactionsAndTokenTransfers();
};

PopulateAddressDetail.prototype.getAllTransactionsAndTokenTransfers = async function () {
  const oThis = this
    , limit = 100
    , allTransactions = []
    , allTokenTransfers = []
  ;

  var minTransactionIndex = oThis.startTransactionIndex;

  while (true) {
    logger.info("** Fetching All Transactions And Token Transfers with offset - ", offset);

    const transactionObj = new TransactionKlass(oThis.chainId)
      , tokenTransferObj = new TokenTransferKlass(oThis.chainId)
      , batchedTransactionHashIds = []
    ;

    const batchedTransactions = await transactionObj.select().where({block_number: oThis.blockNumber})
      .where(['transaction_index >= ? & transaction_index < ?', minTransactionIndex, minTransactionIndex + limit])
      .fire();

    if (batchedTransactions.length === 0) break;

    for (var i = 0; i < batchedTransactions.length; i++) {
      var transactionHashId = batchedTransactions[i].transaction_hash_id;
      batchedTransactionHashIds.push(transactionHashId);
      allTransactions[transactionHashId] = batchedTransactions[i];
    }

    const batchedTokenTransfers = await tokenTransferObj.select().where({transaction_hash_id: batchedTransactionHashIds}).fire();

    for (var i = 0; i < batchedTokenTransfers.length; i++) {
      var transactionHashId = batchedTokenTransfers[i].transaction_hash_id;
      allTokenTransfers[transactionHashId] = allTokenTransfers[transactionHashId] || [];
      allTokenTransfers[transactionHashId].push(batchedTokenTransfers[i]);
    }


     await oThis.processData(allTransactions, allTokenTransfers)
      .then(function (batchedData) {
        oThis.getBalanceFromGeth(batchedData)
      })
      .then(function (batchedData) {
        oThis.formatData(batchedData)
      })
      .then(function (formattedRowArray) {
        oThis.insertUpdateAddressDetail(formattedRowArray)
      })
      .then(function () {
        oThis.updateCronDetailRow(oThis.blockNumber, minTransactionIndex + limit);
      })
      .catch(function (err) {
        logger.notify('pad_gatatt_1', 'error in getAllTransactionsAndTokenTransfers',
          {blockNumber: oThis.blockNumber, startTransactionIndex: oThis.startTransactionIndex, minTransactionIndex: minTransactionIndex,  err: err,});

        var errResponse = responseHelper.error('pad_gatatt_1', 'There was some error in address details population');
        return Promise.resolve(errResponse);
      });

    minTransactionIndex = minTransactionIndex + limit;

  }

  await oThis.updateCronDetailRow(oThis.blockNumber + 1, 0);
  var r = responseHelper.successWithData({blockNumber: oThis.blockNumber + 1, startTransactionIndex: 0});
  return Promise.resolve(r);
};

PopulateAddressDetail.prototype.processData = async function (allTransactions, allTokenTransfers) {
  const oThis = this
    , data = {}
  ;

  for (var transactionHashId in allTransactions) {
    const txn = allTransactions[transactionHashId]
      , tokenTransferTxns = allTokenTransfers[transactionHashId] || []
    ;

    var lastContractAddressId = null;

    for (var i = 0; i < tokenTransferTxns.length; i++) {
      const tokenTransfer = tokenTransferTxns[i]
        , tokenTransferFromAddressId = tokenTransfer.from_address_id
        , tokenTransferToAddressId = tokenTransfer.to_address_id
        , contractAddressId = tokenTransfer.contract_address_id
      ;

      if (data[tokenTransferFromAddressId] == undefined) {
        data[tokenTransferFromAddressId] = {};
      }

      if (data[tokenTransferFromAddressId][contractAddressId] == undefined) {
        data[tokenTransferFromAddressId][contractAddressId] = Object.assign({}, DEFAULT_DATA_FOR_ADDRESSES);
      }

      if (data[tokenTransferToAddressId] == undefined) {
        data[tokenTransferToAddressId] = {};
      }
      if (data[tokenTransferToAddressId][contractAddressId] == undefined) {
        data[tokenTransferToAddressId][contractAddressId] = Object.assign({}, DEFAULT_DATA_FOR_ADDRESSES);
      }

      var fromObj = data[tokenTransferFromAddressId][contractAddressId];
      fromObj.tokens_spent = TokenUnits.add(fromObj.tokens_spent, tokenTransfer.tokens);
      fromObj.total_token_transfers = TokenUnits.add(fromObj.total_token_transfers, 1);

      var toObj = data[tokenTransferToAddressId][contractAddressId];
      toObj.tokens_earned = TokenUnits.add(toObj.tokens_earned, tokenTransfer.tokens);
      toObj.total_token_transfers = TokenUnits.add(toObj.total_token_transfers, 1);


      if (!contractAddressId || contractAddressId === 0 || (lastContractAddressId && lastContractAddressId !== contractAddressId)) {
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

    if (data[fromAddressId] == undefined) {
      data[fromAddressId] = {0: Object.assign({}, DEFAULT_DATA_FOR_ADDRESSES)};
    }

    data[fromAddressId]['0'].tokens_spent = TokenUnits.add(data[fromAddressId]['0'].tokens_spent, txn.tokens);
    data[fromAddressId]['0'].total_transactions = TokenUnits.add(data[fromAddressId]['0'].transactions, 1);

    if (toAddressId != null) {
      if (data[toAddressId] == undefined) {
        data[toAddressId] = {0: Object.assign({}, DEFAULT_DATA_FOR_ADDRESSES)};
      }

      data[toAddressId]['0'].tokens_earned = TokenUnits.add(data[toAddressId]['0'].tokens_earned, txn.tokens);
      data[toAddressId]['0'].total_transactions = TokenUnits.add(data[toAddressId]['0'].transactions, 1);
    }

  }

  return Promise.resolve(data);
};


PopulateAddressDetail.prototype.getBalanceFromGeth = async function (batchedData) {

  const oThis = this
    , paramsData = []
    , contractAddressIdsHash = {}
  ;

  for (var key in data) {
    for (var subKey in data[key]) {
      paramsData.push([key, subKey]);
      contractAddressIdsHash[subKey] = null;
    }
  }

  const contractAddressIds = Object.keys(contractAddressIdsHash)
    , addressObj = new AddressKlass(oThis.chainId)
  ;

  const selectAddressHashesResponse = await addressObj.select(['id', 'address_hash']).where({id: contractAddressIds}).fire();

  for (var i = 0; i < selectAddressHashesResponse.length; i++) {
    const element = selectAddressHashesResponse[i]
      , addressId = element[0]
      , addressHash = element[1]
    ;

    contractAddressIdsHash[addressId] = addressHash;
  }

  const promiseArray = []
  ;

  for (var i = 0; i < paramsData.length; i++) {
    const element = paramsData[i]
      , contractAddress = contractAddressIdsHash[element[1]] // 0 is null ??? is ok??
    ;
    promiseArray.push(oThis.web3Interact.getBalance(element[0], contractAddress));
  }

  const web3Data = await
    Promise.all(promiseArray);

  for (var i = 0; i < paramsData.length; i++) {
    const element = paramsData[i];
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

  Object.keys(data).forEach(function (addressId) {
    var subData = data[addressId];
    Object.keys(subData).forEach(function (contractAddressId) {
      var obj = subData[contractAddressId];
      var row = [];
      row.push(addressId);
      row.push(contractAddressId);
      row.push(obj.tokens);
      row.push(obj.tokens_earned);
      row.push(obj.tokens_spent);
      row.push(obj.total_transactions);
      row.push(obj.total_token_transfers);
      formattedRows.push(row);
    });
  });

  return Promise.resolve(formattedRows);
};

PopulateAddressDetail.prototype.insertUpdateAddressDetail = function (data) {
  const oThis = this
    , addressDetailObj = AddressDetailKlass(oThis.chainId);
  ;

  return addressDetailObj.insertMultiple(['address_id', 'contract_address_id', 'tokens', 'tokens_earned', 'tokens_spent', 'total_transactions', 'total_token_transfers'], data)
    .onDuplicate({
        tokens: 'VALUES(tokens)',
        tokens_earned: 'tokens_earned + VALUES(tokens_earned)',
        tokens_spent: 'tokens_spent + VALUES(tokens_spent)',
        total_transactions: 'total_transactions + VALUES(total_transactions)',
        total_token_transfers: 'total_token_transfers + VALUES(total_token_transfers)',
        updated_at: new Date()
      }
    ).fire()
};

PopulateAddressDetail.prototype.updateCronDetailRow = function (currentBlockNumber, start_from_index) {
  var cronDetailObj = new CronDetailKlass(oThis.chainId);

  return cronDetailObj.update({
    data: {
      block_number: currentBlockNumber,
      start_from_index: start_from_index
    }
  }).where({cron_name: 'address_detail_populate_cron'}).fire();

};

module.exports = {
  newInstance: function (chainId) {
    return new PopulateAddressDetail(chainId);
  }
};