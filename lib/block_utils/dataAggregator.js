"use strict";
/**
 * Aggregate Data
 *
 * @module lib/block_utils/dataAggregator
 */
const rootPrefix = "../.."
    , logger = require(rootPrefix + "/helpers/custom_console_logger")
    , constants = require(rootPrefix + "/config/core_constants")
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
                    return oThis.insertAggregateData(timeId, transactions, internalTxn);
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
                if ( data[txnTypeObject[txn.transaction_hash]] != Object ) {
                    data[txnTypeObject[txn.transaction_hash]] = {};
                }
                var obj = data[txnTypeObject[txn.transaction_hash]];
                obj.total_transactions = isNaN(obj.total_transactions) ? 1 : (obj.total_transactions + 1);
                obj.total_transaction_value = isNaN(obj.total_transaction_value) ? txn.tokens : (obj.total_transaction_value + txn.tokens);
                obj.time_id = timeId;
            });

            internalTransactions.forEach(function(internalTxn){
                var obj = data[txnTypeObject[internalTxn.transaction_hash]];
                obj.total_transfers = isNaN(obj.total_transfers) ? 1 : (obj.total_transfers + 1);
                obj.total_transfer_value = isNaN(obj.total_transfer_value) ? internalTxn.tokens : (obj.total_transfer_value + internalTxn.tokens);
                //Need to convert contract address to contract id
                obj.company_token_id = internalTxn.contract_address;
            });

            var formattedData = oThis.formatData(data);
            console.log("formatted data :", formattedData);

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
        row.push(obj.company_token_id);
        row.push(obj.time_id);

        formattedRows.push(row);
    });

    return formattedRows;
};

module.exports = {
    newInstance: function (dbInteract, chainId) {
        return new DataAggregator(dbInteract, chainId);
    }
};