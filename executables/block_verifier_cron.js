#!/usr/bin/env node
"use strict"

/**
  * File: block_verifier
  * It creates cron job to verify blocks from the node and reinsert them if found inconsistent.
  * Author: Sachin
  */

const reqPrefix           = ".."
    , Web3Interact        = require( reqPrefix + "/lib/web3/interact/rpc_interact")
    , DbInteract          = require( reqPrefix + "/helpers/db/interact.js")
    , logger              = require( reqPrefix + "/helpers/CustomConsoleLogger")
    , core_config         = require( reqPrefix + "/config")
    , BlockVerifier       = require( reqPrefix + "/lib/block_utils/block_verifier")
    , cliHandler          = require('commander');
    ;


var dbInteract;
var web3Interact;

var block_verifier;

//State of the fetcher with config details.
var state = {
    blockNumber : 0,
    chainID     : null,
    config      : null,
};

// To handle command line with format $> node block_fetch.js <chainID>
cliHandler
  .version('1.0')
  .usage('Please Specify chain ID \n$>node block_fetcher.js <chainID> ')
  .option('-c, --chainID <n>', 'Id of the chain', parseInt)
  .option('-n, --blockNumber <n>', 'Number of the block', parseInt)
  .parse(process.argv);

if (cliHandler.chainID) {
    state.chainID = cliHandler.chainID;
    if (isNaN(cliHandler.blockNumber)) {
        state.blockNumber = 0;   
    } else {    
        state.blockNumber = cliHandler.blockNumber;
    }
    state.config = core_config.getChainConfig(state.chainID);
    if (undefined != state.config) {
        dbInteract = DbInteract.getInstance(state.config.db_config);
        web3Interact = new Web3Interact(state.config.web_rpc);
        block_verifier = BlockVerifier.newInstance(web3Interact, dbInteract);
        logger.log('State Configuration', state);
    } else {
        logger.error('\n\tInvalide chain ID \n');
        process.exit(1);
    }
} else {
    logger.error('\n\tPlease Specify chain ID \n\t$>node block_fetcher.js <chainID>\n');
    process.exit(1);
}

//Methods to set timeout for the fetchBlock api
var setBlockVerifier = function(blockNumber) {
    state.blockNumber = blockNumber;
    setTimeout(function() {
        dbInteract.getHigestInsertedBlock()
            .then(function(resBlockNumber){
                logger.log("Higest Block Number ", resBlockNumber);
                if (resBlockNumber != null && +resBlockNumber - 10 > state.blockNumber) {
                    block_verifier.verifyBlock( state.blockNumber, setBlockVerifier);
                } else {
                    //Need to set up the cron again.
                }
            }).catch(function(err){
                logger.error('\nNot able to fetch block number)\n', err);
                process.exit(1);
            }); 

    }, state.config.cron_interval );
}

setBlockVerifier(state.blockNumber);