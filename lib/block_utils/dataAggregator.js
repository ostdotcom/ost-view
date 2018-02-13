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
    , contractDecoder = require(rootPrefix + "/lib/contract_interact/contractDecoder")
    , configHelper = require(rootPrefix + "/helpers/configHelper")
    ;

/**
 * Constructor to create object of DataAggregator
 *
 * @param {Object} web3Interact - web3 object to interact
 * @param {Object} dbInteract - DB object to interact
 * @param {Integer} chainId - chainId of the block chain
 * @constructor
 */
const DataAggregator = function (web3Interact ,dbInteract, chainId) {
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
DataAggregator.prototype.aggregateData = function ( timeId, aggregateDataCompleteCallback ) {
    logger.info('**Aggregate Block**');

    this.callback = aggregateDataCompleteCallback;
    var oThis = this;

    oThis.dbInteract.getTransactionsByTimeId( timeId )
        .then(function (transactions) {
            var promiseArray = [];
            transactions.forEach(function( txn ){
                promiseArray.push(oThis.dbInteract.getTokenTransactions(txn.transaction_hash));
            });
            return Promise.all(promiseArray)
                .then(function( internalTransactions ) {
                    var internalTxn = [];
                    internalTransactions.forEach(function(txnArray){
                       if (txnArray.length > 0) {
                           txnArray.forEach(function(txn){
                              internalTxn.push(txn);
                           });
                       }
                    });
                    return oThis.handleTransactionLogEvents(transactions)
                        .then(function(){
                            oThis.insertAggregateData(timeId, transactions, internalTxn)
                                .then(function(){
                                    return oThis.insertAddressData(transactions, internalTxn) ;
                                });
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

    console.log("transactions ", transactions, internalTransactions);

    transactions.forEach(function( txn ){
        txnHashes.push(txn.transaction_hash);
    });

    var oThis = this;

    return oThis.dbInteract.getTransactionType(txnHashes)
        .then(function(transactionsTypes) {
            var txnTypeObject = {};
            transactionsTypes.forEach(function(txnObject) {
                txnTypeObject[txnObject.transaction_hash] = txnObject.transaction_type;
            });

            transactions.forEach(function( txn ){
                if ( data[txnTypeObject[txn.transaction_hash]] == undefined ) {
                    data[txnTypeObject[txn.transaction_hash]] = {};
                    data[txnTypeObject[txn.transaction_hash]].total_transactions = 0;
                    data[txnTypeObject[txn.transaction_hash]].total_transaction_value = 0;
                    data[txnTypeObject[txn.transaction_hash]].total_transfers = 0;
                    data[txnTypeObject[txn.transaction_hash]].total_transfer_value = 0;
                }
                var obj = data[txnTypeObject[txn.transaction_hash]];
                obj.total_transactions = +obj.total_transactions + 1;
                obj.total_transaction_value = +obj.total_transaction_value + txn.tokens;
                obj.time_id = timeId;
            });

            internalTransactions.forEach(function(internalTxn) {
                var obj = data[txnTypeObject[internalTxn.transaction_hash]];
                obj.total_transfers = +obj.total_transfers + 1;
                obj.total_transfer_value = +obj.total_transfer_value + internalTxn.tokens;
                obj.branded_token_id = configHelper.getIdOfContract(internalTxn.contract_address)
            });

            var formattedData = oThis.formatData(data);
            console.log("formatted data :", JSON.stringify(formattedData));

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
    Object.keys(data).forEach(function (key){
        var row = [];
        var obj = data[key];

        row.push(obj.total_transactions);
        row.push(obj.total_transaction_value);
        row.push(obj.total_transfers);
        row.push(obj.total_transfer_value);
        row.push(key);
        row.push(isNaN(obj.branded_token_id) ? 0 : obj.branded_token_id);
        row.push(obj.time_id);

        formattedRows.push(row);
    });

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

    console.log("transactions ", transactions, internalTransactions);

    transactions.forEach(function( txn ){
        if (data[txn.t_from] == undefined ) {
            data[txn.t_from] = { 0: {tokens:0, tokens_earned:0 ,tokens_spent:0 , transactions:0} };
        }
        data[txn.t_from][0].tokens = +data[txn.t_from][0].tokens - txn.tokens;
        data[txn.t_from][0].tokens_spent = +data[txn.t_from][0].tokens_spent + txn.tokens;
        data[txn.t_from][0].transactions = +data[txn.t_from][0].transactions + 1;

        if (txn.t_to != null) {
            if (data[txn.t_to] == undefined) {
                data[txn.t_to] = { 0: {tokens: 0, tokens_earned:0 ,tokens_spent:0, transactions: 0}};
            }
            data[txn.t_to][0].tokens = +data[txn.t_to][0].tokens + txn.tokens;
            data[txn.t_to][0].tokens_earned = +data[txn.t_to][0].tokens_earned + txn.tokens;
            data[txn.t_to][0].transactions = +data[txn.t_to][0].transactions + 1;
        }
    });

    internalTransactions.forEach(function(internalTxn) {
        if (data[internalTxn.t_from] == undefined) {
            data[internalTxn.t_from] = {};
        }
        if (data[internalTxn.t_from][internalTxn.contract_address] == undefined) {
            data[internalTxn.t_from][internalTxn.contract_address] = {tokens: 0, transactions: 0};
        }

        var fromObj = data[internalTxn.t_from][internalTxn.contract_address];
        fromObj.tokens = +fromObj.tokens - internalTxn.tokens;
        fromObj.tokens_spent = +fromObj.tokens_spent + internalTxn.tokens_spent;
        fromObj.transactions = +fromObj.transactions + 1;

        if (data[internalTxn.t_to] == undefined) {
            data[internalTxn.t_to] = {};
        }
        if (data[internalTxn.t_to][internalTxn.contract_address] == undefined) {
            data[internalTxn.t_to][internalTxn.contract_address] = {tokens: 0, transactions: 0};
        }
        var toObj = data[internalTxn.t_to][internalTxn.contract_address];
        toObj.tokens = +toObj.tokens + internalTxn.tokens;
        toObj.tokens_earned = +toObj.tokens_earned + internalTxn.tokens;
        toObj.transactions = +toObj.transactions + 1;
    });

    return oThis.updateAddressBalance(data)
                .then(function (updatedData){
                    var formattedData = oThis.formatAddressData(updatedData);
                    console.log("formatted data :", JSON.stringify(formattedData));
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
    Object.keys(data).forEach(function (key){
        var subData = data[key];
        Object.keys(subData).forEach(function(subkey){
            promiseArray.push(oThis.web3Interact.getBalance(key, subkey));
        });
    });
    return Promise.all(promiseArray)
        .then(function(result){
            var ind = 0;
            Object.keys(data).forEach(function (key){
                var subData = data[key];
                Object.keys(subData).forEach(function(subkey){
                    data[key][subkey].tokens = result[ind].weiBalance;
                    ind+=1;
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
    Object.keys(data).forEach(function (key){
        var subData = data[key];
        Object.keys(subData).forEach(function(subkey){
            var obj = subData[subkey];
            var row = [];
            row.push(key);
            row.push(configHelper.getIdOfContract(subkey));
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
    if (undefined == config.getChainConfig(oThis.chainId)){
        logger.error("config.getChainConfig is undefined having chain ID ", oThis.chainId);
        return;
    }

    var promiseArray = [];

    this.dbInteract.getBrandedTokenDetails()
        .then(function(btResult){
            btResult.forEach(function(contractHash){
                contractHash.tokens_transfer_data = {};
                contractHash.tokens_volume_data = {};
                contractHash.transactions_data = {};
                contractHash.transactions_volume_data = {};
                contractHash.transaction_type_data = {};
                promiseArray.push(oThis.insertGraphDataOfCompany(contractHash));
            });

            Promise.all(promiseArray)
                .then(function(responseData) {
                    return oThis.updateTotalTokenHolders(responseData);
                })
                .then(function(res) {
                    var formattedData = oThis.formatCompanyData(res);
                    oThis.dbInteract.insertOrUpdateCompanyDataArray(formattedData);
                });

            oThis.formatCompanyData = function (res) {
                var formattedData = [];
                res.forEach(function(hash){
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
                    formattedData.push(row);
                });

                return formattedData;
            };
        });
};

/**
 * To Insert Graph Data of the Company
 * @param contractHash
 */
DataAggregator.prototype.insertGraphDataOfCompany = function (contractHash) {
    var oThis = this;
    return oThis.dbInteract.getAggregateLastInsertedTimeId()
        .then(function(timeId) {
            oThis.timeId = timeId;
            return oThis.addGraphForLastDay(contractHash, timeId);
        })
        .then(function(responseContract){
            return oThis.addGraphForLastHour(responseContract, oThis.timeId)
        })
        .then(function(responseContract){
            return oThis.addGraphForLastWeek(responseContract, oThis.timeId)
        })
        .then(function(responseContract){
            return oThis.addGraphForLastMonth(responseContract, oThis.timeId)
        })
        .then(function(responseContract){
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
    return this.addGraph({
        contractHash: contractHash,
        timeId: timeId,
        quantum: 30 * 12 * 24 * constants.AGGREGATE_CONSTANT,
        graphSize: 12,
        graphScale: 'All'
    });
};

/**
 * Add graph for Last day
 * @param {String} contractHash - Contract hash
 * @param {Integer} timeId - Time id
 * @returns {Promise}
 */
DataAggregator.prototype.addGraphForLastDay = function(contractHash, timeId) {

    return this.addGraph({
        contractHash: contractHash,
        timeId: timeId,
        quantum: 12 * constants.AGGREGATE_CONSTANT,
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
DataAggregator.prototype.addGraphForLastHour = function(contractHash, timeId) {

    return this.addGraph({
        contractHash: contractHash,
        timeId: timeId,
        quantum: constants.AGGREGATE_CONSTANT,
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
DataAggregator.prototype.addGraphForLastWeek = function(contractHash, timeId) {

    return this.addGraph({
        contractHash: contractHash,
        timeId: timeId,
        quantum: 12 * 24 * constants.AGGREGATE_CONSTANT,
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
DataAggregator.prototype.addGraphForLastMonth = function(contractHash, timeId) {

    return this.addGraph({
        contractHash: contractHash,
        timeId: timeId,
        quantum: 12 * 24 * constants.AGGREGATE_CONSTANT,
        graphSize: 30,
        graphScale: 'Month'
    });
};

/**
 * To Add Graph for last hour
 * @param {Hash} params - Parameters
 * @returns {Promise}
 */
DataAggregator.prototype.addGraph = function(params) {

    var oThis = this;
    var contractHash = params.contractHash;
    var timeId = params.timeId;
    var quantum = params.quantum;
    var graphSize = params.graphSize;
    var graphScale = params.graphScale;

    console.log("LOGS :", JSON.stringify(params));

    var promiseArray = [];
    var timeId1 = timeId - graphSize * quantum;
    var timeId2 = timeId1 + quantum;
    for (var i=0;i<graphSize;i++) {
        promiseArray.push(oThis.dbInteract.getAggregateDataWithinTimestamp(contractHash.id, timeId1, timeId2));
        timeId1 = timeId2;
        timeId2 = timeId1 + quantum;
    }
    this.checkNull = function(val) {
        if (val === null) {
            return 0;
        }
        return val;
    };
    return Promise.all(promiseArray)
        .then(function(promiseResponse){
            //logger.log(promiseResponse);
            var total_transactions = [];
            var total_transaction_value = [];
            var total_transfers = [];
            var total_transfer_value = [];
            var transaction_type_data = [];
            var timestamp = timeId - graphSize * quantum;
            promiseResponse.forEach(function(data){

                var val = data[0]['SUM(total_transactions)'];
                total_transactions.push({transaction_count :oThis.checkNull(val), timestamp: timestamp, ost_amount:"xyz"});

                val = data[0]['SUM(total_transaction_value)'];
                total_transaction_value.push({transaction_value :oThis.checkNull(val), timestamp: timestamp});

                val = data[0]['SUM(total_transfers)'];
                total_transfers.push({transaction_count :oThis.checkNull(val), timestamp: timestamp, ost_amount:"xyz"});

                val = data[0]['SUM(total_transfer_value)'];
                total_transfer_value.push({transaction_amount :oThis.checkNull(val), timestamp: timestamp});

                timestamp+=quantum;
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
            contractHash.transactions_volume_data[graphScale] = total_transactions;

            return oThis.dbInteract.getAggregateDataWithinTimestampByType(contractHash.id, timeId - graphSize * quantum, timeId1)
                .then(function(data) {
                    if (contractHash.transaction_type_data == undefined) {
                        contractHash.transaction_type_data = {};
                    }
                    if ( 0 < data.length ) {
                        var i=0;
                        data.forEach(function(subData) {
                            //To Do:: Replace 'i' with transaction type
                            transaction_type_data.push({type: i, total_transfers: subData['SUM(total_transfers)']});
                            i++;
                        });
                    }
                    contractHash.transaction_type_data[graphScale] = transaction_type_data;

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
    data.forEach(function (entity){
        promiseArray.push(oThis.dbInteract.getTotalTokenDetails(entity.id));
    });
    return Promise.all(promiseArray)
        .then(function(result){
            var ind = 0;
            data.forEach(function (entity){
                entity.token_holders = result[ind].tokenHolders;
                entity.circulation = result[ind].tokenCirculation;
                entity.market_cap = entity.circulation * entity.price;
                ind+=1;
            });
            return Promise.resolve(data);
        });
};

/**
 * To Handle relevant log events of transactions
 * @param {Array} transactions - Transactions
 */
DataAggregator.prototype.handleTransactionLogEvents = function(transactions) {
    var oThis = this;
    var promiseArray = [];
    transactions.forEach(function( txn ) {
        var logs = JSON.parse(txn['logs']);
        console.log("Event logs", txn['logs']);
        var eventArray = contractDecoder.decodeLogs(logs);

        eventArray.forEach(function(event){
            switch(event.eventName) {
                case 'RegisteredBrandedToken':
                    //Format data for insertion
                    var result = oThis.dbInteract.numberOfRowsInBrandedTokenTable()
                        .then(function(noOfRows){
                            var dataRow = [];
                            dataRow.push(noOfRows);
                            dataRow.push(event._name);
                            dataRow.push(event._token);
                            dataRow.push(event._symbol);
                            dataRow.push(event._uuid);
                            dataRow.push(event._conversionRate);
                            dataRow.push(0);
                            dataRow.push(0);
                            dataRow.push(0);
                            dataRow.push(0);
                            dataRow.push(null);
                            dataRow.push(null);
                            dataRow.push(null);
                            dataRow.push(null);
                            dataRow.push(null);
                            return oThis.dbInteract.insertOrUpdateCompanyDataArray([dataRow]).
                                then(function(){
                                    return configHelper.syncUpContractMap(oThis.dbInteract);
                                });
                        });
                    promiseArray.push(result);
                    break;
                default:
                    break;
            }
        });
    });
    return Promise.all(promiseArray);
};

module.exports = {
    newInstance: function (web3Interact, dbInteract, chainId) {
        return new DataAggregator(web3Interact, dbInteract, chainId);
    }
};