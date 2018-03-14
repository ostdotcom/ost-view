"use strict";
/**
 * Aggregate Data
 *
 * @module lib/block_utils/dataAggregator
 */
const rootPrefix = "../.."
  , logger = require(rootPrefix + "/helpers/custom_console_logger")
  , constants = require(rootPrefix + "/config/core_constants")
  , config = require(rootPrefix + "/config")
  , configHelper = require(rootPrefix + "/helpers/configHelper")
  , TokenUnits = require(rootPrefix + "/helpers/tokenUnits")
  , GraphTimeUtilsKlass = require(rootPrefix + "/lib/graphTimeUtils")
  ;


/**
 * Constructor to create object of DataAggregator
 *
 * @param {Object} web3Interact - web3 object to interact
 * @param {Object} dbInteract - DB object to interact
 * @param {Integer} chainId - chainId of the block chain
 * @constructor
 */
const DataAggregator = function (web3Interact, dbInteract, chainId) {
  this.web3Interact = web3Interact;
  this.dbInteract = dbInteract;
  this.chainId = chainId;
};

/**
 * Method to aggregate data based on timeId.
 * It gets all the transactions within timeId 5 min span.
 *
 * @param  {Integer} timeId - timeId
 * @param  {Function} aggregateDataCompleteCallback - verification complete callback
 *
 * @return {null}
 */
DataAggregator.prototype.aggregateData = function (timeId, aggregateDataCompleteCallback) {
  logger.info('**Aggregate Block**');

  this.callback = aggregateDataCompleteCallback;
  var oThis = this;

  oThis.dbInteract.getTransactionsByTimeId(timeId)
    .then(function (transactions) {
      var promiseArray = [];
      transactions.forEach(function (txn) {
        promiseArray.push(oThis.dbInteract.getTokenTransactions(txn.transaction_hash));
      });
      return Promise.all(promiseArray)
        .then(function (internalTransactions) {
          var internalTxn = [];
          internalTransactions.forEach(function (txnArray) {
            if (txnArray.length > 0) {
              txnArray.forEach(function (txn) {
                internalTxn.push(txn);
              });
            }
          });

          return oThis.insertAggregateData(timeId, transactions, internalTxn)
            .then(function () {
              return oThis.insertAddressData(transactions, internalTxn);
            });
        });
    })
    .then(function () {
      oThis.callback(+timeId + constants.AGGREGATE_CONSTANT);
    })
    .catch(function (err) {
      logger.error(err);
      oThis.callback(timeId);
    });
};

/**
 * Aggregate data before insertion into db
 * @param {Integer} timeId - Time id
 * @param {Array} transactions - block transactions
 * @param {Array} internalTransactions - company token transactions
 * @returns {Promise}
 */
DataAggregator.prototype.insertAggregateData = function (timeId, transactions, internalTransactions) {
  const data = {};
  var txnHashes = [];

  console.info("total transactions to be aggregated ==> ", transactions.length, internalTransactions.length);
  //console.debug("transactions ", transactions, internalTransactions);

  transactions.forEach(function (txn) {
    txnHashes.push(txn.transaction_hash);
  });

  var oThis = this;

  return oThis.dbInteract.getTransactionType(txnHashes)
    .then(function (transactionsTypes) {

      var i;
      const txHashToTypeIdMap = {}
        , txToBtIdMap = {};

      for(i=0; i<transactionsTypes.length; i++){
        txHashToTypeIdMap[transactionsTypes[i].transaction_hash.toLowerCase()] = transactionsTypes[i].transaction_type_id;
      }

      for(i=0; i<internalTransactions.length; i++){
        var internalTx = internalTransactions[i]
          , iTxHash = internalTx.transaction_hash.toLowerCase()
          , contractAddr = internalTx.contract_address.toLowerCase()
          , iBtId =  configHelper.getIdOfContract(contractAddr) || 0
          , contractInfo = configHelper.contractIdMap[contractAddr] || {}
          , ostToBtConversationFactor = contractInfo.price || 0
          , iTxTypeId = txHashToTypeIdMap[iTxHash] || 0
          ;

        txToBtIdMap[iTxHash] = iBtId;

        data[iBtId] = data[iBtId] || {};
        data[iBtId][iTxTypeId] = data[iBtId][iTxTypeId] || {
          total_transactions: 0,
          total_transaction_value: 0,
          total_transfers: 0,
          total_transfer_value: 0,
          token_ost_volume: 0,
          time_id: timeId
        };

        var inTxObj = data[iBtId][iTxTypeId];
        inTxObj.total_transfers = TokenUnits.add(inTxObj.total_transfers, 1);
        inTxObj.total_transfer_value = TokenUnits.add(inTxObj.total_transfer_value, internalTx.tokens);
        inTxObj.token_ost_volume = TokenUnits.mul(inTxObj.total_transfer_value, ostToBtConversationFactor);

      }

      for(i=0; i<transactions.length; i++){
        var transaction = transactions[i]
          , txHash = transaction.transaction_hash.toLowerCase()
          , txTypeId = txHashToTypeIdMap[txHash] || 0
          , btId = txToBtIdMap[txHash] || 0
          ;

        data[btId] = data[btId] || {};
        data[btId][txTypeId] = data[btId][txTypeId] || {
          total_transactions: 0,
          total_transaction_value: 0,
          total_transfers: 0,
          total_transfer_value: 0,
          token_ost_volume: 0,
          time_id: timeId
        };

        var txObj = data[btId][txTypeId];
        txObj.total_transactions = TokenUnits.add(txObj.total_transactions, 1);
        txObj.total_transaction_value = TokenUnits.add(txObj.total_transaction_value, transaction.tokens);
      }






      //var txnTypeObject = {};
      ////To initialize hashes not having transaction type
      //for(i=0; i<txnHashes.length; i++){
      //  txnTypeObject[txnHashes[i]] = 0;
      //}
      //
      //transactionsTypes.forEach(function (txnObject) {
      //  txnTypeObject[txnObject.transaction_hash] = txnObject.transaction_type_id;
      //});
      //
      //transactions.forEach(function (txn) {
      //  if(!txnTypeObject[txn.transaction_hash]) txnTypeObject[txn.transaction_hash] = 0;
      //
      //  if (data[txnTypeObject[txn.transaction_hash]] == undefined) {
      //    data[txnTypeObject[txn.transaction_hash]] = {};
      //    data[txnTypeObject[txn.transaction_hash]][0] = {
      //      total_transactions: 0,
      //      total_transaction_value: 0,
      //      total_transfers: 0,
      //      total_transfer_value: 0,
      //      branded_token_id: 0,
      //      time_id: timeId
      //    };
      //  }
      //  var obj = data[txnTypeObject[txn.transaction_hash]][0];
      //  obj.total_transactions = TokenUnits.add(obj.total_transactions, 1);
      //  obj.total_transaction_value = TokenUnits.add(obj.total_transaction_value, txn.tokens);
      //});
      //
      //console.log('data-0000000000000-------------------', data);
      //console.log('internalTransactions-------------------', internalTransactions);
      //
      //internalTransactions.forEach(function (internalTxn) {
      //
      //  var btId =  configHelper.getIdOfContract(internalTxn.contract_address.toLowerCase());
      //  if(btId){
      //    var obj = data[txnTypeObject[internalTxn.transaction_hash]][btId];
      //    console.log('data-111-------------------', data);
      //    if (undefined == obj) {
      //      // default values should't be deleted for btId==0(for OST alfa)
      //      var defaultTxStats = data[txnTypeObject[internalTxn.transaction_hash]][0];
      //      console.log('in--btId-----------------', btId, '--defaultTxStats--', defaultTxStats);
      //      delete data[txnTypeObject[internalTxn.transaction_hash]][0];
      //
      //      data[txnTypeObject[internalTxn.transaction_hash]][btId] = defaultTxStats;
      //      console.log('data-3334444444-------------------', data);
      //      obj = data[txnTypeObject[internalTxn.transaction_hash]][btId];
      //    }
      //    console.log('data-2222222222-------------------', data);
      //    console.log('obj--------------------', obj, '--btId-----', btId);
      //    console.log('internalTxn.transaction_hash--------------------', internalTxn.transaction_hash);
      //    console.log('internalTxn--------------------', internalTxn);
      //    console.log('txnTypeObject------', txnTypeObject);
      //    console.log('txnTypeObject[internalTxn.transaction_hash]-------', txnTypeObject[internalTxn.transaction_hash]);
      //    //console.log('data[txnTypeObject[internalTxn.transaction_hash]]-----', data[txnTypeObject[internalTxn.transaction_hash]]);
      //
      //    //console.log('data----------------', JSON.stringify(data));
      //
      //    obj.total_transfers = TokenUnits.add(obj.total_transfers, 1);
      //    obj.total_transfer_value = TokenUnits.add(obj.total_transfer_value, internalTxn.tokens);
      //  }
      //});

      var formattedData = oThis.formatData(data);
      //console.debug("formatted data :", JSON.stringify(formattedData));

      return oThis.dbInteract.insertIntoAggregateTable(formattedData);
    });
};

/**
 * To format aggregate data
 * @param {Hash} data - data to be formatted
 * @returns {Array}
 */
DataAggregator.prototype.formatData = function (data) {
  var formattedRows = [];

  for(var btId in data){
    for(var txTypeId in data[btId]){
      var row = [];
      var obj = data[btId][txTypeId];

      row.push(obj.total_transactions);
      row.push(obj.total_transaction_value);
      row.push(obj.total_transfers);
      row.push(obj.total_transfer_value);
      row.push(txTypeId);
      row.push(btId);
      row.push(obj.time_id);
      row.push(obj.token_ost_volume);

      formattedRows.push(row);
    }
  }

  return formattedRows;
};

/**
 * To insert Address data into db after formatting.
 * @param {Array} transactions - block transactions
 * @param {Array} internalTransactions - company token transactions
 * @returns {Promise}
 */
DataAggregator.prototype.insertAddressData = function (transactions, internalTransactions) {
  var oThis = this;
  const data = {};

  console.log("transactions/internal transactions to be inserted are => ", transactions.length, '/',internalTransactions.length);
  //console.debug("transactions ", transactions, internalTransactions);

  transactions.forEach(function (txn) {
    if (data[txn.t_from] == undefined) {
      data[txn.t_from] = {0: {tokens: 0, tokens_earned: 0, tokens_spent: 0, transactions: 0}};
    }
    data[txn.t_from]['0'].tokens = TokenUnits.sub(data[txn.t_from]['0'].tokens, txn.tokens);
    data[txn.t_from]['0'].tokens_spent = TokenUnits.add(data[txn.t_from]['0'].tokens_spent, txn.tokens);
    data[txn.t_from]['0'].transactions = TokenUnits.add(data[txn.t_from]['0'].transactions, 1);

    if (txn.t_to != null) {
      if (data[txn.t_to] == undefined) {
        data[txn.t_to] = {0: {tokens: 0, tokens_earned: 0, tokens_spent: 0, transactions: 0}};
      }
      data[txn.t_to]['0'].tokens = TokenUnits.add(data[txn.t_to]['0'].tokens, txn.tokens);
      data[txn.t_to]['0'].tokens_earned = TokenUnits.add(data[txn.t_to]['0'].tokens_earned, txn.tokens);
      data[txn.t_to]['0'].transactions = TokenUnits.add(data[txn.t_to]['0'].transactions, 1);
    }
  });

  internalTransactions.forEach(function (internalTxn) {
    if (data[internalTxn.t_from] == undefined) {
      data[internalTxn.t_from] = {};
    }
    if (data[internalTxn.t_from][internalTxn.contract_address] == undefined) {
      data[internalTxn.t_from][internalTxn.contract_address] = {
        tokens: 0,
        tokens_earned: 0,
        tokens_spent: 0,
        transactions: 0
      };
    }

    var fromObj = data[internalTxn.t_from][internalTxn.contract_address];
    fromObj.tokens = TokenUnits.sub(fromObj.tokens, internalTxn.tokens);
    fromObj.tokens_spent = TokenUnits.add(fromObj.tokens_spent, internalTxn.tokens);
    fromObj.transactions = TokenUnits.add(fromObj.transactions, 1);

    if (data[internalTxn.t_to] == undefined) {
      data[internalTxn.t_to] = {};
    }
    if (data[internalTxn.t_to][internalTxn.contract_address] == undefined) {
      data[internalTxn.t_to][internalTxn.contract_address] = {
        tokens: 0,
        tokens_earned: 0,
        tokens_spent: 0,
        transactions: 0
      };
    }
    var toObj = data[internalTxn.t_to][internalTxn.contract_address];
    toObj.tokens = TokenUnits.add(toObj.tokens, internalTxn.tokens);
    toObj.tokens_earned = TokenUnits.add(toObj.tokens_earned, internalTxn.tokens);
    toObj.transactions = TokenUnits.add(toObj.transactions, 1);
  });

  return oThis.updateAddressBalance(data)
    .then(function (updatedData) {
      var formattedData = oThis.formatAddressData(updatedData);
      //console.debug("formatted data :", JSON.stringify(formattedData));
      return oThis.dbInteract.insertOrUpdateAddressData(formattedData);
    });
};

/**
 * To Update Address hash with balance
 * @param {Hash} data - data to be updated with balance
 * @returns {Promise<U>|*}
 */
DataAggregator.prototype.updateAddressBalance = function (data) {
  var oThis = this;
  var promiseArray = [];
  Object.keys(data).forEach(function (key) {
    var subData = data[key];
    Object.keys(subData).forEach(function (subkey) {
      promiseArray.push(oThis.web3Interact.getBalance(key, subkey));
    });
  });
  return Promise.all(promiseArray)
    .then(function (result) {
      var ind = 0;
      Object.keys(data).forEach(function (key) {
        var subData = data[key];
        Object.keys(subData).forEach(function (subkey) {
          data[key][subkey].tokens = result[ind].weiBalance;
          ind += 1;
        });
      });
      return Promise.resolve(data);
    });
};

/**
 * To format address data
 * @param {Hash} data - data to be formatted
 * @returns {Array} Array of formatted data
 */
DataAggregator.prototype.formatAddressData = function (data) {
  var oThis = this;
  var formattedRows = [];
  Object.keys(data).forEach(function (key) {
    var subData = data[key];
    Object.keys(subData).forEach(function (subkey) {
      var obj = subData[subkey];
      var row = [];
      row.push(key);
      row.push(configHelper.getIdOfContract(subkey.toLowerCase()));
      row.push(obj.tokens);
      row.push(obj.tokens_earned);
      row.push(obj.tokens_spent);
      row.push(obj.transactions);
      formattedRows.push(row);
    });
  });

  return formattedRows;
};

/**
 * To setUpCache Data in DB.
 */
DataAggregator.prototype.setUpCacheData = function () {

  var oThis = this;
  //1. Set Up companyData
  if (undefined == config.getChainConfig(oThis.chainId)) {
    logger.error("config.getChainConfig is undefined having chain ID ", oThis.chainId);
    return;
  }

  var promiseArray = [];

  return this.dbInteract.getBrandedTokenDetails()
    .then(function (btResult) {
      btResult.forEach(function (contractHash) {
        contractHash.tokens_transfer_data = {};
        contractHash.tokens_volume_data = {};
        contractHash.transactions_data = {};
        contractHash.transactions_volume_data = {};
        contractHash.transaction_type_data = {};
        promiseArray.push(oThis.insertGraphDataOfCompany(contractHash));
      });

      oThis.formatCompanyData = function (res) {
        var formattedData = [];
        res.forEach(function (hash) {
          var row = [];
          row.push(hash.id);
          row.push(hash.company_name);
          row.push(hash.contract_address);
          row.push(hash.company_symbol);
          row.push(hash.uuid);
          row.push(hash.price);
          row.push(hash.token_holders);
          row.push(hash.market_cap);
          row.push(hash.circulation);
          row.push(hash.total_supply);
          row.push(JSON.stringify(hash.transactions_data));
          row.push(JSON.stringify(hash.transactions_volume_data));
          row.push(JSON.stringify(hash.tokens_transfer_data));
          row.push(JSON.stringify(hash.tokens_volume_data));
          row.push(JSON.stringify(hash.transaction_type_data));
          row.push(hash.token_transfers);
          row.push(hash.token_ost_volume);
          row.push(hash.creation_time);
          row.push(hash.symbol_icon);
          formattedData.push(row);
        });

        return formattedData;

      };

      return Promise.all(promiseArray)
        .then(function (responseData){
          return oThis.updateTotalSupply(responseData);
        })
        .then(function (responseData) {
          return oThis.updateTotalTokenHolders(responseData);
        })
        .then(function (responseData){
          return oThis.updateTokensData(responseData);
        })
        .then(function (res) {
          var formattedData = oThis.formatCompanyData(res);
          return oThis.dbInteract.insertOrUpdateCompanyDataArray(formattedData);
        });
    });
};

/**
 * To Insert Graph Data of the Company
 * @param contractHash
 */
DataAggregator.prototype.insertGraphDataOfCompany = function (contractHash) {
  var oThis = this;
  return oThis.dbInteract.getLastVerifiedBlockTimestamp()
    .then(function (timeId) {
      oThis.timeId = timeId;
      return oThis.addGraphForLastDay(contractHash, timeId);
    })
    .then(function (responseContract) {
      return oThis.addGraphForLastHour(responseContract, oThis.timeId)
    })
    .then(function (responseContract) {
      return oThis.addGraphForLastWeek(responseContract, oThis.timeId)
    })
    .then(function (responseContract) {
      return oThis.addGraphForLastMonth(responseContract, oThis.timeId)
    })
    .then(function (responseContract) {
      return oThis.addGraphForLastYear(responseContract, oThis.timeId)
    })
    .then(function (responseContract) {
      return oThis.addGraphForAll(responseContract, oThis.timeId)
    });
};

/**
 * Add graph for All
 * @param {String} contractHash - Contract hash
 * @param {Integer} timeId - Time id
 * @returns {Promise}
 */
DataAggregator.prototype.addGraphForAll = function (contractHash, timeId) {
  var oThis = this;
  return oThis.dbInteract.getBlockFromBlockNumber(0)
    .then(function (block) {
      var timeDifference = timeId - block.timestamp;
      var quantum = 30 * 12 * 24 * constants.AGGREGATE_CONSTANT;
      var graphSize = parseInt(timeDifference / quantum) + 1;
      return oThis.addGraph({
        contractHash: contractHash,
        timeId: timeId,
        graphSize: graphSize,
        graphScale: 'All',
        blockStartTimestamp: block.timestamp
      });
    });
};

/**
 * Add graph for Last Year
 * @param {String} contractHash - Contract hash
 * @param {Integer} timeId - Time id
 * @returns {Promise}
 */
DataAggregator.prototype.addGraphForLastYear = function (contractHash, timeId) {
  return this.addGraph({
    contractHash: contractHash,
    timeId: timeId,
    graphSize: 12,
    graphScale: 'Year'
  });
};

/**
 * Add graph for Last day
 * @param {String} contractHash - Contract hash
 * @param {Integer} timeId - Time id
 * @returns {Promise}
 */
DataAggregator.prototype.addGraphForLastDay = function (contractHash, timeId) {

  return this.addGraph({
    contractHash: contractHash,
    timeId: timeId,
    graphSize: 24,
    graphScale: 'Day'
  });
};

/**
 * To Add Graph for last hour
 * @param {String} contractHash - Contract hash
 * @param {Integer} timeId - Time Id
 * @returns {Promise}
 */
DataAggregator.prototype.addGraphForLastHour = function (contractHash, timeId) {
  return this.addGraph({
    contractHash: contractHash,
    timeId: timeId,
    graphSize: 12,
    graphScale: 'Hour'
  });
};

/**
 * To Add Graph for last Week
 * @param {String} contractHash - Contract hash
 * @param {Integer} timeId - Time Id
 * @returns {Promise}
 */
DataAggregator.prototype.addGraphForLastWeek = function (contractHash, timeId) {

  return this.addGraph({
    contractHash: contractHash,
    timeId: timeId,
    graphSize: 7,
    graphScale: 'Week'
  });
};

/**
 * To Add Graph for last Month
 * @param {String} contractHash - Contract hash
 * @param {Integer} timeId - Time Id
 * @returns {Promise}
 */
DataAggregator.prototype.addGraphForLastMonth = function (contractHash, timeId) {

  return this.addGraph({
    contractHash: contractHash,
    timeId: timeId,
    graphSize: 30,
    graphScale: 'Month'
  });
};

/**
 * To Add Graph for last hour
 * @param {Hash} params - Parameters
 * @returns {Promise}
 */
DataAggregator.prototype.addGraph = function (params) {

  var oThis = this;
  var contractHash = params.contractHash;
  var timeId = params.timeId;
  var graphSize = params.graphSize;
  var graphScale = params.graphScale;

  var graphTimeObj = new GraphTimeUtilsKlass(timeId, graphScale, params.blockStartTimestamp);

  console.debug("LOGS :", JSON.stringify(params));

  var promiseArray = [];
  var promiseArrayAux = [];
  var graphStartTime = graphTimeObj.setGraphStartTime();
  var timeId1 = graphStartTime;
  var graphTimeStamps = [];
  graphTimeStamps.push(graphStartTime);
  graphTimeStamps.push(graphTimeObj.getNextTimestamp());
  for (var i = 0; i < graphSize; i++) {
    var timeId2 = graphTimeStamps[graphTimeStamps.length - 1];
    promiseArray.push(oThis.dbInteract.getAggregateDataWithinTimestamp(contractHash.id, timeId1, timeId2));
    promiseArrayAux.push(oThis.dbInteract.getTransferAggregateDataWithinTimestamp(contractHash.id, timeId1, timeId2));
    timeId1 = timeId2;
    graphTimeStamps.push(graphTimeObj.getNextTimestamp());
  }
  this.checkNull = function (val) {
    if (val === null) {
      return 0;
    }
    return val;
  };
  return Promise.all(promiseArray)
    .then(function (promiseResponse) {
      //logger.log(promiseResponse);
      var total_transactions = [];
      var total_transaction_value = [];
      var total_transfers = [];
      var total_transfer_value = [];
      var transaction_type_data = [];
      var timestamp = graphTimeStamps[0];
      var i = 1;
      promiseResponse.forEach(function (data) {

        var val = data[0]['SUM(total_transactions)'];
        total_transactions.push({
          timestamp: timestamp,
          transaction_count: oThis.checkNull(val),
          ost_amount: TokenUnits.weiToEther(TokenUnits.toBigNumber(data[0]['SUM(total_transfer_value)']).div(oThis.checkNull(contractHash.price))).toString(),
          ost_alpha: 0
        });

        val = data[0]['SUM(total_transaction_value)'];
        total_transaction_value.push({timestamp: timestamp, transaction_value: oThis.checkNull(val)});

        val = data[0]['SUM(total_transfers)'];
        total_transfers.push({
          timestamp: timestamp,
          transaction_count: oThis.checkNull(val),
          ost_amount: TokenUnits.weiToEther(TokenUnits.toBigNumber(data[0]['SUM(total_transfer_value)']).div(oThis.checkNull(contractHash.price))).toString()
        });

        val = data[0]['SUM(total_transfer_value)'];
        total_transfer_value.push({timestamp: timestamp, transaction_amount: oThis.checkNull(val)});

        timestamp = graphTimeStamps[i];
        i+=1;
      });

      if (contractHash.tokens_transfer_data == undefined) {
        contractHash.tokens_transfer_data = {};
      }
      contractHash.tokens_transfer_data[graphScale] = total_transfer_value;

      if (contractHash.tokens_volume_data == undefined) {
        contractHash.tokens_volume_data = {};
      }
      contractHash.tokens_volume_data[graphScale] = total_transfers;

      if (contractHash.transactions_data == undefined) {
        contractHash.transactions_data = {};
      }
      contractHash.transactions_data[graphScale] = total_transaction_value;

      if (contractHash.transactions_volume_data == undefined) {
        contractHash.transactions_volume_data = {};
      }
      contractHash.transactions_volume_data[graphScale] = contractHash.token_transfers != 0 ? total_transactions : [];

      return oThis.dbInteract.getAggregateDataWithinTimestampByType(contractHash.id, graphTimeStamps[0], graphTimeStamps[graphTimeStamps.length-1])
        .then(function (data) {
          if (contractHash.transaction_type_data == undefined) {
            contractHash.transaction_type_data = {};
          }
          if (0 < data.length) {
            var i = 0;
            data.forEach(function (subData) {
              transaction_type_data.push({
                type: subData['transaction_type'],
                total_transfers: subData['SUM(a.total_transactions)']
              });
              i++;
            });
          }
          contractHash.transaction_type_data[graphScale] = transaction_type_data;

          return Promise.resolve(contractHash);
        })
        .then(function(contractHash) {
          if (contractHash.token_transactions == undefined) {
            return oThis.dbInteract.getTypeTokenStatsData(contractHash.id)
              .then(function (response) {
                contractHash.token_transactions = response.token_transactions;
                contractHash.transactions_volume_data[graphScale] = response.token_transactions ? total_transactions : [];
                return Promise.resolve(contractHash);
              });
          } else {
            contractHash.transactions_volume_data[graphScale] = contractHash.token_transactions ? total_transactions : [];
            return Promise.resolve(contractHash);
          }
        });

    })
    .then(function(contractHash){
        return Promise.all(promiseArrayAux)
          .then(function(promiseResponse){
            var total_transfers = [];
            var timestamp = graphTimeStamps[0];
            var j=1;
            promiseResponse.forEach(function (data) {

              var val = data[0]['SUM(total_transfers)'];
              total_transfers.push({
                timestamp: timestamp,
                transaction_count: oThis.checkNull(val),
                ost_amount: TokenUnits.weiToEther(TokenUnits.toBigNumber(data[0]['SUM(total_transfer_value)']).div(oThis.checkNull(contractHash.price))).toString()
              });
              timestamp = graphTimeStamps[j];
              j += 1;
            });

            if (contractHash.tokens_volume_data == undefined) {
              contractHash.tokens_volume_data = {};
            }
            contractHash.tokens_volume_data[graphScale] = contractHash.token_transfers != 0 ? total_transfers : [];
            return Promise.resolve(contractHash);
          });
    });
};

/**
 * To update Total token holders of company
 * @param {Array} data - Array of address data
 * @returns {Promise}
 */
DataAggregator.prototype.updateTotalTokenHolders = function (data) {
  var oThis = this;
  var promiseArray = [];
  data.forEach(function (entity) {
    promiseArray.push(oThis.dbInteract.getTotalTokenDetails(entity.id));
  });
  return Promise.all(promiseArray)
    .then(function (result) {
      var ind = 0;
      data.forEach(function (entity) {
        entity.token_holders = result[ind].tokenHolders;
        entity.circulation = result[ind].tokenCirculation;
        entity.market_cap = TokenUnits.toBigNumber(entity.total_supply).div(TokenUnits.toBigNumber(entity.price)).toString(10);
        ind += 1;
      });
      return Promise.resolve(data);
    });
};

/**
 * To Handle relevant log events of transactions
 * @param {Array} companyData - Company Data
 */
DataAggregator.prototype.updateTotalSupply = function (companyData) {
  var oThis = this;
  var promiseArray = [];
  companyData.forEach(function (entity) {
    promiseArray.push(oThis.web3Interact.getTotalSupply(entity.contract_address));
  });
  return Promise.all(promiseArray)
    .then(function(totalSupplyResponse){
      var i = 0;
      companyData.forEach(function (entity) {
        entity.total_supply = totalSupplyResponse[i];
        i++;
      });
      return Promise.resolve(companyData);
    });
};

/**
 * To update company token data
 * @param companyData
 */
DataAggregator.prototype.updateTokensData = function (companyData) {
  var oThis = this;
  var promiseArray = [];
  companyData.forEach(function (entity) {
    promiseArray.push(oThis.dbInteract.getTokenStatsData(configHelper.getIdOfContract(entity.contract_address.toLowerCase())));
  });
  return Promise.all(promiseArray)
    .then(function(response){
      var i = 0;
      companyData.forEach(function (entity) {
        entity.token_transfers = TokenUnits.toBigNumber(response[i].token_transfers).toString(10);
        entity.token_ost_volume = TokenUnits.toBigNumber(response[i].token_volume).toString(10);
        i++;
      });
      return Promise.resolve(companyData);
    });
};

module.exports = {
  newInstance: function (web3Interact, dbInteract, chainId) {
    return new DataAggregator(web3Interact, dbInteract, chainId);
  }
};