"use strict"

/**
  * File: block_fetcher
  * It creates cron job to fetch blocks from the node and feed them into the provided DB.
  * Author: Sachin
  */

const reqPrefix           = ".."
    , Web3Interact        = require( reqPrefix + "/lib/web3/interact/rpc_interact")
    , DbInteract          = require( reqPrefix + "/helpers/db/interact.js")
    , logger              = require( reqPrefix + "/helpers/CustomConsoleLogger")
    , erctoken            = require( reqPrefix + "/lib/contract_interact/erc20Token")
    , constants           = require( reqPrefix + "/config/core_constants")
    , core_config         = require( reqPrefix + "/config")
    ;


var dbInteract;
var web3Interact

//State of the fetcher with config details.
var state = {
    chainID     : 141,
    blockNumber : 0,
    config      : core_config['141'],
};

//Methods to set timeout for the fetchBlock api
var setfetchBlockCron = function(blockNumber) {
    setTimeout(function() {
        fetchBlock(blockNumber);
    }, state.config.cron_interval );
}

//Method to start cron from the higest block available.
var fetchBlocks = async function() {
    const hightestBlockResult = await web3Interact.highestBlock();
    
    if (hightestBlockResult != null) {
        const hightestBlock = hightestBlockResult.data.block_number;
        setfetchBlockCron(hightestBlock);
    } else {
        setfetchBlockCron(state.blockNumber);
    }
}

//Method to fetch block using blockNumber
var fetchBlock = function(blockNumber) {
    // check for undefined object
    if(blockNumber == undefined) {
        logger.log("In #fetchBlock undefined blockNumber ");
        return; 
    }

    // Set state
    state.blockNumber = blockNumber;
    logger.log('************* New Block ***************')

    logger.log("\tBlock number", blockNumber);

    web3Interact.isNodeConnected()
        .then(function() { return web3Interact.getBlock(blockNumber);})
        .then(writeBlockToDB)
        .then(writeTransactionsToDB)
        .then(writeTokenTansactionToDB)
        .then(setfetchBlockCron)
        .catch(errorHandling);
}

var errorHandling = function(err) {
    logger.log("ERROR " + err);
    setfetchBlockCron(state.blockNumber);
}


var writeBlockToDB = function(blockDataResponse) {
    logger.log("Importing block into DB. Please wait.");
    logger.log(blockDataResponse.data);
    
    return new Promise(function(resolve, reject){
        if (blockDataResponse.success != true) {
            logger.log("Block success failure");
            reject('{success:false}');
        } else {
            var blockData = formatBlockData(blockDataResponse.data);
            dbInteract.insertBlock(blockData).then(
                function(res){
                    //console.log(res);
                    resolve(blockDataResponse.data);
                });  
        }  
    });
    
}

var formatBlockData = function( rawBlockData ) {
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

var formatTransactionData = function( transactionRes,  receiptRes, timestamp) {
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

var formatTokenTransactionData = function( transaction, decodedContTransactionList) {
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

var writeTransactionsToDB =  function(blockData) {
    var bulkOps = [];
    var transactions = blockData.transactions;

    console.log("Transaction Array",transactions);
    return new Promise(function(resolve, reject){
        if (transactions != undefined && transactions.length > 0) {
            var promiseReceiptArray = [];
            var promiseTransactionArray = [];
            for (var index in transactions) {
                    logger.info("Transaction :", transactions[index]);
                    
                    var promiseReceipt = web3Interact.getReceipt(transactions[index]);
                    var promiseTransaction = web3Interact.getTransaction(transactions[index]);
                    
                    promiseReceiptArray.push(promiseReceipt);
                    promiseTransactionArray.push(promiseTransaction);
            }

            Promise.all(promiseTransactionArray)
                .then(function(res) {
                    var transactionRes = res;
                    Promise.all(promiseReceiptArray)
                        .then(function(res) {
                            var receiptRes = res;
                            var insertionTransactionArray = formatTransactionData(transactionRes, receiptRes, blockData.timestamp);
                            dbInteract.insertTransaction(insertionTransactionArray).then(
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

var writeTokenTansactionToDB = function (transactionArray) {

    return new Promise(function(resolve, reject){
        if (transactionArray.length > 0) {
            logger.log("TokenTransaction#Logs ");
            var decodedTxnArray = [];
            for (var txnIndex in transactionArray) {
                var transaction =  transactionArray[txnIndex];   
                var decodedContTransaction = erctoken.decodeTransactionsFromLogs(JSON.parse(transaction[constants['TRANSACTION_INDEX_MAP']['logs']]));
                var decodedTxn = formatTokenTransactionData(transaction, decodedContTransaction);
                for (var index in decodedTxn) {
                    decodedTxnArray.push(decodedTxn[index]);
                }
            }
            logger.log(decodedTxnArray);
            dbInteract.insertTokenTransaction(decodedTxnArray)
            .then(
                function(res){
                    resolve(+state.blockNumber + 1);
                });
        } else {
            resolve(+state.blockNumber + 1);
        }
    });

}

var isNodeConnected = function(blockNumber) {
    return new Promise(function(resolve,reject) {
         web3.eth.net.isListening()
            .then(function(msg){
                resolve(blockNumber);
            }).catch(function(err){
                reject("\n\tYou Geth Node Client is down with ERROR :\n" + err);
            });
    }); 
}

// To handle command line with format $> node block_fetch.js <chainID> <initial_block_number>
if (process.argv.length > 2) {
    state.chainID = process.argv[2];
    if (isNaN(process.argv[3])) {
        state.blockNumber = 0;   
    } else {
        state.blockNumber = process.argv[3];
    }    
    state.config = core_config.getChainConfig(state.chainID);
    if (undefined != state.config) {
        dbInteract = DbInteract.getInstance(state.config.db_config);
        web3Interact = new Web3Interact(state.config.web_rpc);
        logger.log('State Configuration', state);
    } else {
        logger.error('\n\tInvalide chain ID \n');
        process.exit(1);
    }
} else {
    logger.error('\n\tPlease Specify chain ID \n\t$>node block_fetcher.js <chainID> <blockNumber>(optional)\n');
    process.exit(1);
}

dbInteract.getHigestInsertedBlock()
    .then(function(blockNumber){
        logger.log("Higest Block Number ", blockNumber);
        if (state.blockNumber == 0 && blockNumber != null) {
            state.blockNumber = +blockNumber + 1;
        }
        setfetchBlockCron(state.blockNumber);
    }).catch(function(err){
        logger.error('\nNot able to fetch block number)\n', err);
        process.exit(1);
    }); 

