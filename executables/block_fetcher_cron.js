#!/usr/bin/env node
"use strict"

/**
  * File: block_fetcher_cron
  * It creates job to fetch blocks from the node and feed them into the provided DB.
  * @module executables/
  */

const reqPrefix           = ".."
    , Web3Interact        = require( reqPrefix + "/lib/web3/interact/rpc_interact")
    , DbInteract          = require( reqPrefix + "/helpers/db/interact.js")
    , logger              = require( reqPrefix + "/helpers/CustomConsoleLogger")
    , core_config         = require( reqPrefix + "/config")
    , BlockFetcher        = require( reqPrefix + "/lib/block_utils/block_fetcher")
    , cliHandler          = require('commander');
    ;


var dbInteract;
var web3Interact;

var block_fetcher;

/**
 * Maintain the state for the block fetcher
 * @type {hash}
 */
var state = {
    chainID     : null,
    blockNumber : 0,
    config      : null,
};

/**
 * setfetchBlockCron
 * Methods to set timeout for the fetchBlock api
 * @param  {Integer} Number of the block
 * @return {null}
 */
var setfetchBlockCron = function(blockNumber) {
    setTimeout(function() {
        block_fetcher.fetchAndUpdateBlock(blockNumber, setfetchBlockCron);
    }, state.config.polling_interval );
}

/**
 * To handle command line with format $> node block_fetch_cron.js --chainID <chainID> --blockNumber [initial_block_number]
 * It picks up next last inserted block to start the fetching process if the blockNumber is not provided.
 */
cliHandler
  .version('1.0')
  .usage('Please Specify chain ID \n$>node block_fetcher.js <chainID> <blockNumber>(optional)')
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
        block_fetcher = BlockFetcher.newInstance(web3Interact, dbInteract, false);
        block_fetcher.state.blockNumber = state.blockNumber;
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
        if (block_fetcher.state.blockNumber == 0 && blockNumber != null) {
            block_fetcher.state.blockNumber = +blockNumber + 1;
        }
        setfetchBlockCron(block_fetcher.state.blockNumber);
    }).catch(function(err){
        logger.error('\nNot able to fetch block number)\n', err);
        process.exit(1);
    }); 

