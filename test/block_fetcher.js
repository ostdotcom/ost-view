
var web3Interact = require('../lib/web3/interact/value_rpc_interact');
var dbInteract = require('../helpers/db/interact.js');
const logger = require('../helpers/CustomConsoleLogger');
var erctoken = require('../lib/contract_interact/erc20Token');
var BigNumber = require('bignumber.js');

var web3 = web3Interact;
//var Utils = require('./utils.js');
//const web3RpcProvider = require('./web3/rpc_provider');

var setfetchBlockCron = function(blockNumber) {
    setTimeout(function() {
        fetchBlock(blockNumber);
    }, 2000/*config.cronInterval*/ );
}

var state = {
    blockNumber:0
};

var fetchBlocks = async function(config) {
    const hightestBlockResult = await web3Interact.highestBlock();
    
    if (hightestBlockResult != null) {
        const hightestBlock = hightestBlockResult.data.block_number;

        setfetchBlockCron(hightestBlock/*config.initBlock*/);
    } else {
        setfetchBlockCron(122/*config.initBlock*/);
    }
}

var fetchBlock = function(blockNumber) {
    // check for undefined object
    if(blockNumber == undefined) {
        console.log("fetchBlock undefined blockNumber ");
        return; 
    }

    // Set state
    state.blockNumber = blockNumber;
    console.log('************* New Block ***************')

    console.log("Block number", blockNumber);
    console.log("State Block number", state.blockNumber);

    web3Interact.isNodeConnected()
        .then(function() { return web3Interact.getBlock(blockNumber);})
        .then(writeBlockToDB)
        .then(writeTransactionsToDB)
        .then(writeTansactionToLedger)
        .then(setfetchBlockCron)
        .catch(errorHandling);
}

// var getBlockData = function(web3) {
//     return new Promise(function(resolve, reject) {
//         web3.eth.getBlock(blockNumber, true, function(error, blockData) {
//             if(error) {
//                 reject(error);
//             }
//             else if(blockData == null) {
//                 reject(null);
//             }
//             else { 
//                 resolve(blockData);
//             }

//         });
//     });
    
// }

var errorHandling = function(err) {
    console.log("ERROR" + err);
    setfetchBlockCron(state.blockNumber);
}


var writeBlockToDB = function(blockDataResponse) {
    console.log("Importing block into DB. Please wait.");
    console.log(blockDataResponse.data);
    
    return new Promise(function(resolve, reject){
        if (blockDataResponse.success != true) {
            console.log("Block success failure");
            reject('{success:false}');
        } else {
            var blockData = formatBlockData(blockDataResponse.data);
            var res = dbInteract.insertBlock(blockData);
            //console.log(res);
            resolve(blockDataResponse.data);   
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
        formatedContractTxn.push( transaction[0] );
        formatedContractTxn.push( decodedContTransaction.address );
        formatedContractTxn.push( decodedContTransaction._from );
        formatedContractTxn.push( decodedContTransaction._to );
        formatedContractTxn.push( decodedContTransaction._value );
        formatedContractTxn.push( transaction[12]);

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
    var blockNumber = blockData.number;
    console.log("transaction array", blockData ,transactions, blockNumber);
    return new Promise(function(resolve, reject){
        if (transactions != undefined && transactions.length > 0) {
            var promiseReceiptArray = [];
            var promiseTransactionArray = [];
            for (index in transactions) {
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
                            var res = dbInteract.insertTransaction(insertionTransactionArray);
                            console.log(res);

                            resolve(insertionTransactionArray);
                        });
                });
    } else {
        resolve([]);
    }
    
    });
}

var writeTansactionToLedger = function (transactionArray) {

    console.log("InternalTransaction#Logs ");

    return new Promise(function(resolve, reject){
        if (transactionArray.length > 0) {
            var decodedTxnArray = [];
            for (var txnIndex in transactionArray) {
                var transaction =  transactionArray[txnIndex];   
                console.log("JSON PARSED", transaction) 
                var decodedContTransaction = erctoken.decodeTransactionsFromLogs(JSON.parse(transaction[11]));
                var decodedTxn = formatTokenTransactionData(transaction, decodedContTransaction);
                for (var index in decodedTxn) {
                    decodedTxnArray.push(decodedTxn[index]);
                }
            }
            console.log(decodedTxnArray);
            var res = dbInteract.insertTokenTransaction(decodedTxnArray);
            console.log(res);
        }
        resolve(state.blockNumber + 1);
    });

}

var isNodeConnected = function(blockNumber) {
    return new Promise(function(resolve,reject) {
         web3.eth.net.isListening()
            .then(function(msg){
                resolve(blockNumber);
            }).catch(function(err){
                reject(err);
            });
    }); 
}

// var processOfTableDeletion = function() {
//     console.log('Table deletion process completed');
//     return dbhandle.createTables()
// }

// var processOfTableCreation = function() {
//     console.log('Table creation process completed');
//     fetchBlocks();
// }

/** On Startup **/
// geth --rpc --rpcaddr "localhost" --rpcport "8545"  --rpcapi "eth,net,web3"

var config;
setfetchBlockCron(95);
// try {
//     var configContents = fs.readFileSync('config.json');
//     config = JSON.parse(configContents);
// }
// catch (error) {
//     if (error.code === 'ENOENT') {
//         console.log('No config file found. Using default configuration (will ' + 
//             'download all blocks starting from latest)');
//     }
//     else {
//         throw error;
//         process.exit(1);
//     }
// }

// // set the default geth port if it's not provided
// if (!('gethPort' in config) || (typeof config.gethPort) !== 'number') {
//     config.gethPort = 8545; // default
// }

// console.log('Using configuration:');
//console.log(config);