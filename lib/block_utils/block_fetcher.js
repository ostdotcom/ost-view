#!/usr/bin/env node
"use strict"

/**
  * File: block_fetcher
  * It creates cron job to fetch blocks from the node and feed them into the provided DB.
  * Author: Sachin
  */

const reqPrefix           = "../.."
    , logger              = require( reqPrefix + "/helpers/CustomConsoleLogger")
    , erctoken            = require( reqPrefix + "/lib/contract_interact/erc20Token")
    , constants           = require( reqPrefix + "/config/core_constants")
    ;

const BlockFetcher = function(web3Interact, dbInteract) {
    this.web3Interact = web3Interact;
    this.dbInteract = dbInteract;
}

//State of the fetcher with config details.
BlockFetcher.prototype.state = {
    blockNumber : 0
};


//Method to fetch block using blockNumber
BlockFetcher.prototype.fetchBlock = function(blockNumber, insertionCompleteCallback) {
    
    this.callback = insertionCompleteCallback;
    var oThis = this;

    // check for undefined object
    if(blockNumber == undefined) {
        logger.log("In #fetchBlock undefined blockNumber ");
        return; 
    }

    // Set state
    oThis.state.blockNumber = blockNumber;
    logger.log('************* New Block ***************')

    logger.log("\tBlock number", blockNumber);

    oThis.web3Interact.isNodeConnected()
        .then(function() { 
            return oThis.web3Interact.getBlock(blockNumber);
        })
        .then( function (response) { 
            return oThis.writeBlockToDB(response) 
        })
        .then( function (response) { 
            return oThis.writeTransactionsToDB(response)   
        })
        .then( function (response) { 
            return oThis.writeTokenTansactionToDB(response)  
        })
        .then( function (response) { 
            if ( oThis.callback ) {
                return oThis.callback(response)      
            }
        }) 
        .catch( function () { return oThis.errorHandling() } );
}

BlockFetcher.prototype.errorHandling = function(err) {
    logger.log("ERROR " + err);
    this.callback(this.state.blockNumber);
}


BlockFetcher.prototype.writeBlockToDB = function(blockDataResponse) {
    
    var oThis = this;

    logger.log("Importing block into DB. Please wait.");
    logger.log(blockDataResponse.data);
    
    return new Promise(function(resolve, reject){
        if (blockDataResponse.success != true) {
            logger.log("Block success failure");
            reject('{success:false}');
        } else {
            var blockData = oThis.formatBlockData(blockDataResponse.data);
            oThis.dbInteract.insertBlock(blockData).then(
                function(res){
                    //console.log(res);
                    resolve(blockDataResponse.data);
                });  
        }  
    });
    
}

BlockFetcher.prototype.formatBlockData = function( rawBlockData ) {
    var formatedBlockData = [];
    formatedBlockData.push(rawBlockData.number);
    formatedBlockData.push(rawBlockData.hash);
    formatedBlockData.push(rawBlockData.parentHash);
    formatedBlockData.push(rawBlockData.miner);
    formatedBlockData.push(rawBlockData.difficulty);
    formatedBlockData.push(rawBlockData.totalDifficulty);
    formatedBlockData.push(rawBlockData.gasLimit);
    formatedBlockData.push(rawBlockData.gasUsed);
    formatedBlockData.push(rawBlockData.transactions.length);
    formatedBlockData.push(rawBlockData.timestamp);
    return formatedBlockData;
}

BlockFetcher.prototype.formatTransactionData = function( transactionRes,  receiptRes, timestamp) {
    var insertionArray = [];
    for (var resInd in transactionRes) {
        var txn = transactionRes[resInd];
        var rtxn = receiptRes[resInd];

        var txnArray = [];

        txnArray.push(txn.hash);
        txnArray.push(txn.blockNumber);
        txnArray.push(txn.transactionIndex);
        txnArray.push(rtxn.contractAddress);
        txnArray.push(txn.from);
        txnArray.push(txn.to);
        txnArray.push(txn.value);
        txnArray.push(txn.gas);
        txnArray.push(txn.gasPrice);
        txnArray.push(txn.nonce);
        txnArray.push(JSON.stringify(txn.input));
        txnArray.push(JSON.stringify(rtxn.logs));
        txnArray.push(timestamp);

        insertionArray.push(txnArray);
    }
    return insertionArray;
}

BlockFetcher.prototype.formatTokenTransactionData = function( transaction, decodedContTransactionList) {
    var formatedContractTxnList = [];

    for ( var ind in decodedContTransactionList) {
        var decodedContTransaction = decodedContTransactionList[ind];
        var formatedContractTxn = [];
        formatedContractTxn.push( transaction[constants['TRANSACTION_INDEX_MAP']['hash']] );
        formatedContractTxn.push( decodedContTransaction.address );
        formatedContractTxn.push( decodedContTransaction._from );
        formatedContractTxn.push( decodedContTransaction._to );
        formatedContractTxn.push( decodedContTransaction._value );
        formatedContractTxn.push( transaction[constants['TRANSACTION_INDEX_MAP']['timestamp']]);

        formatedContractTxnList.push(formatedContractTxn);
    }

    return formatedContractTxnList;
}


/**
    Break transactions out of blocks and write to DB
**/

BlockFetcher.prototype.writeTransactionsToDB =  function(blockData) {
    
    var oThis = this;

    var bulkOps = [];
    var transactions = blockData.transactions;

    console.log("Transaction Array",transactions);
    return new Promise(function(resolve, reject){
        if (transactions != undefined && transactions.length > 0) {
            var promiseReceiptArray = [];
            var promiseTransactionArray = [];
            for (var index in transactions) {
                    logger.info("Transaction :", transactions[index]);
                    
                    var promiseReceipt = oThis.web3Interact.getReceipt(transactions[index]);
                    var promiseTransaction = oThis.web3Interact.getTransaction(transactions[index]);
                    
                    promiseReceiptArray.push(promiseReceipt);
                    promiseTransactionArray.push(promiseTransaction);
            }

            Promise.all(promiseTransactionArray)
                .then(function(res) {
                    var transactionRes = res;
                    Promise.all(promiseReceiptArray)
                        .then(function(res) {
                            var receiptRes = res;
                            var insertionTransactionArray = oThis.formatTransactionData(transactionRes, receiptRes, blockData.timestamp);
                            oThis.dbInteract.insertTransaction(insertionTransactionArray).then(
                                function(res){
                                    resolve(insertionTransactionArray);
                                });  
                        });
                });
    } else {
        resolve([]);
    }
    
    });
}

BlockFetcher.prototype.writeTokenTansactionToDB = function (transactionArray) {

    var oThis = this;

    return new Promise(function(resolve, reject){
        if (transactionArray.length > 0) {
            logger.log("TokenTransaction#Logs ");
            var decodedTxnArray = [];
            for (var txnIndex in transactionArray) {
                var transaction =  transactionArray[txnIndex];   
                var decodedContTransaction = erctoken.decodeTransactionsFromLogs(JSON.parse(transaction[constants['TRANSACTION_INDEX_MAP']['logs']]));
                var decodedTxn = oThis.formatTokenTransactionData(transaction, decodedContTransaction);
                for (var index in decodedTxn) {
                    decodedTxnArray.push(decodedTxn[index]);
                }
            }
            logger.log(decodedTxnArray);
            oThis.dbInteract.insertTokenTransaction(decodedTxnArray)
            .then(
                function(res){
                    resolve(+oThis.state.blockNumber + 1);
                });
        } else {
            resolve(+oThis.state.blockNumber + 1);
        }
    });
}


module.exports = {
    newInstance: function(web3Interact, dbInteract) {
        return new BlockFetcher(web3Interact, dbInteract);
    } 
}