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
    ;

/**
 * Constructor to create object of DataAggregator
 *
 * @param {Object} dbInteract - DB object to interact
 * @param {Integer} chainId - chainId of the block chain
 * @constructor
 */
const DataAggregator = function (dbInteract, chainId) {
    this.dbInteract = dbInteract;
    this.chainId = chainId;
    this.contractIdMap = config.getContractIdMap(chainId);
};

/**
 * Method to verify block of blockNumber. First to check the verify flag from DB.
 * If false, Check for block hash from geth and from DB
 * if inconsistent, correct the data.
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
                    return oThis.insertAggregateData(timeId, transactions, internalTxn)
                        .then(function(){
                           return oThis.insertAddressData(transactions, internalTxn) ;
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
 * @param timeId - Time id
 * @param transactions - block transactions
 * @param internalTransactions - company token transactions
 * @returns {Promise<U>|*}
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
                obj.company_token_id = oThis.contractIdMap[internalTxn.contract_address]
            });

            var formattedData = oThis.formatData(data);
            console.log("formatted data :", JSON.stringify(formattedData));

            return oThis.dbInteract.insertIntoAggregateTable(formattedData);
        });
};

/**
 * To format data
 * @param data - data to be formatted
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
        row.push(isNaN(obj.company_token_id) ? 0 : obj.company_token_id);
        row.push(obj.time_id);

        formattedRows.push(row);
    });

    return formattedRows;
};

DataAggregator.prototype.insertAddressData = function (transactions, internalTransactions) {
    var oThis = this;
    const data = {};

    console.log("transactions ", transactions, internalTransactions);

    transactions.forEach(function( txn ){
        if (data[txn.t_from] == undefined ) {
            data[txn.t_from] = { 0: {tokens:0, transactions:0} };
        }
        data[txn.t_from][0].tokens = +data[txn.t_from][0].tokens - txn.tokens;
        data[txn.t_from][0].transactions = +data[txn.t_from][0].transactions + 1;

        if (txn.t_to != null) {
            if (data[txn.t_to] == undefined) {
                data[txn.t_to] = {0: {tokens: 0, transactions: 0}};
            }
            data[txn.t_to][0].tokens = +data[txn.t_to][0].tokens + txn.tokens;
            data[txn.t_to][0].transactions = +data[txn.t_to][0].transactions + 1;
        }
    });

    internalTransactions.forEach(function(internalTxn) {
        if (data[internalTxn.t_from] == undefined) {
            data[internalTxn.t_from] = {};
        }
        if (data[internalTxn.t_from][oThis.contractIdMap[internalTxn.contract_address]] == undefined) {
            data[internalTxn.t_from][oThis.contractIdMap[internalTxn.contract_address]] = {tokens: 0, transactions: 0};
        }

        var fromObj = data[internalTxn.t_from][oThis.contractIdMap[internalTxn.contract_address]];
        fromObj.tokens = +fromObj.tokens - internalTxn.tokens;
        fromObj.transactions = +fromObj.transactions + 1;

        if (data[internalTxn.t_to] == undefined) {
            data[internalTxn.t_to] = {};
        }
        if (data[internalTxn.t_to][oThis.contractIdMap[internalTxn.contract_address]] == undefined) {
            data[internalTxn.t_to][oThis.contractIdMap[internalTxn.contract_address]] = {tokens: 0, transactions: 0};
        }
        var toObj = data[internalTxn.t_to][oThis.contractIdMap[internalTxn.contract_address]];
        toObj.tokens = +toObj.tokens + internalTxn.tokens;
        toObj.transactions = +toObj.transactions + 1;
    });

    var formattedData = this.formatAddressData(data);
    console.log("formatted data :", JSON.stringify(formattedData));
    return this.dbInteract.insertOrUpdateAddressData(formattedData);


};

/**
 * To format address data
 * @param data - data to be formatted
 * @returns {Array}
 */
DataAggregator.prototype.formatAddressData = function (data) {
    var formattedRows = [];
    Object.keys(data).forEach(function (key){
        var subData = data[key];
        Object.keys(subData).forEach(function(subkey){
            var obj = subData[subkey];
            var row = [];
            row.push(key);
            row.push(subkey);
            row.push(obj.tokens);
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
    if (undefined == config.getChainConfig(this.chainId)){
        logger.error("config.getChainConfig is undefined having chain ID ", this.chainId);
        return;
    }
    var promiseArray = [];

    config.getChainConfig(this.chainId).company_token_addresses.forEach(function(contractHash){
        promiseArray.push(oThis.insertGraphDataOfCompany(contractHash));
    });

    Promise.all(promiseArray)
        .then(function(res){
           console.log(JSON.stringify(res));
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
            row.push(hash.price);
            row.push(hash.token_holders);
            row.push(hash.market_cap);
            row.push(hash.circulation);
            row.push(hash.total_supply);
            row.push(JSON.stringify(hash.transactions_data));
            row.push(JSON.stringify(hash.transactions_volume_data));
            row.push(JSON.stringify(hash.tokens_transfer_data));
            row.push(JSON.stringify(hash.tokens_volume_data));
            formattedData.push(row);
        });

        return formattedData;
    };
};

/**
 * To Insert Graph Data of the Company
 * @param contractHash
 */
DataAggregator.prototype.insertGraphDataOfCompany = function (contractHash) {
    var oThis = this;
    return oThis.dbInteract.getLastInsertedTimeId()
        .then(function(timeId) {
            oThis.timeId = timeId;
            return oThis.addGraphForLastDay(contractHash, timeId);
        })
        .then(function(responseContract){return oThis.addGraphForLastHour(responseContract, oThis.timeId)});

};

/**
 * Add graph for Last day
 * @param contractHash
 * @param timeId
 * @returns {Promise<U>|*}
 */
DataAggregator.prototype.addGraphForLastDay = function(contractHash, timeId) {
    //For Last 24 hours
    var oThis = this;
    var promiseArray = [];
    var quantum = 12*constants.AGGREGATE_CONSTANT;
    var timeId1 = timeId - 24 * quantum;
    var timeId2 = timeId1 + quantum;
    for (var i=0;i<24;i++) {
        promiseArray.push(oThis.dbInteract.getAggregateDataWithinTimestamp(contractHash.id, timeId1, timeId2));
        timeId1 = timeId2;
        timeId2 = timeId1 + quantum;
    }
    return Promise.all(promiseArray)
        .then(function(promiseResponse){
            //logger.log(promiseResponse);
            var total_transactions = [];
            var total_transaction_value = [];
            var total_transfers = [];
            var total_transfer_value = [];
            promiseResponse.forEach(function(data){
                total_transactions.push(data[0]['SUM(total_transactions)']);
                total_transaction_value.push(data[0]['SUM(total_transaction_value)']);
                total_transfers.push(data[0]['SUM(total_transfers)']);
                total_transfer_value.push(data[0][ 'SUM(total_transfer_value)']);
            });

            if (contractHash.tokens_transfer_data == undefined) {
                contractHash.tokens_transfer_data = {};
            }
            contractHash.tokens_transfer_data.D = total_transfer_value;
            if (contractHash.tokens_volume_data == undefined) {
                contractHash.tokens_volume_data = {};
            }
            contractHash.tokens_volume_data.D = total_transfers;
            if (contractHash.transactions_data == undefined) {
                contractHash.transactions_data = {};
            }
            contractHash.transactions_data.D = total_transaction_value;
            if (contractHash.transactions_volume_data == undefined) {
                contractHash.transactions_volume_data = {};
            }
            contractHash.transactions_volume_data.D = total_transactions;

            return Promise.resolve(contractHash);
        });
};

/**
 * To Add Graph for last hour
 * @param contractHash
 * @returns {Promise}
 */
DataAggregator.prototype.addGraphForLastHour = function(contractHash, timeId) {
    //For Last 24 hours
    var oThis = this;
    var promiseArray = [];
    var quantum = constants.AGGREGATE_CONSTANT;
    var timeId1 = timeId - 12 * quantum;
    var timeId2 = timeId1 + quantum;
    for (var i=0;i<12;i++) {
        promiseArray.push(oThis.dbInteract.getAggregateDataWithinTimestamp(contractHash.id, timeId1, timeId2));
        timeId1 = timeId2;
        timeId2 = timeId1 + quantum;
    }
    return Promise.all(promiseArray)
        .then(function(promiseResponse){
            //logger.log(promiseResponse);
            var total_transactions = [];
            var total_transaction_value = [];
            var total_transfers = [];
            var total_transfer_value = [];
            promiseResponse.forEach(function(data){
                total_transactions.push(data[0]['SUM(total_transactions)']);
                total_transaction_value.push(data[0]['SUM(total_transaction_value)']);
                total_transfers.push(data[0]['SUM(total_transfers)']);
                total_transfer_value.push(data[0][ 'SUM(total_transfer_value)']);
            });

            if (contractHash.tokens_transfer_data == undefined) {
                contractHash.tokens_transfer_data = {};
            }
            contractHash.tokens_transfer_data.H = total_transfer_value;
            if (contractHash.tokens_volume_data == undefined) {
                contractHash.tokens_volume_data = {};
            }
            contractHash.tokens_volume_data.H = total_transfers;
            if (contractHash.transactions_data == undefined) {
                contractHash.transactions_data = {};
            }
            contractHash.transactions_data.H = total_transaction_value;
            if (contractHash.transactions_volume_data == undefined) {
                contractHash.transactions_volume_data = {};
            }
            contractHash.transactions_volume_data.H = total_transactions;


            return Promise.resolve(contractHash);
        });
};

module.exports = {
    newInstance: function (dbInteract, chainId) {
        return new DataAggregator(dbInteract, chainId);
    }
};