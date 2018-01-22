#!/usr/bin/env node
"use strict"

/**
  * File: block_verifier
  * It creates job to run verify block api.
  * @module executables/
  */

const rootPrefix           = ".."
    , Web3Interact        = require( rootPrefix + "/lib/web3/interact/rpc_interact")
    , DbInteract          = require( rootPrefix + "/helpers/db/interact.js")
    , logger              = require( rootPrefix + "/helpers/custom_console_logger")
    , core_config         = require( rootPrefix + "/config")
    , BlockVerifier       = require( rootPrefix + "/lib/block_utils/block_verifier")
    , cliHandler          = require('commander');
    ;


var dbInteract;
var web3Interact;

var block_verifier;

/**
 * Maintain the state for the block fetcher
 * @type {hash} state
 */
var state = {
    blockNumber : 0,
    chainID     : null,
    config      : null,
};

/**
 * To handle command line with format $> node block_verifier_cron.js --chainID <chainID> --blockNumber <initial_block_number>
 */
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
    logger.error('\n\tPlease Specify chain ID \n\t$>node block_fetcher.js --chainID <chainID>\n');
    process.exit(1);
}

/**
 * Methods to set timeout for the verifyBlock api
 * @param {Integer} blockNumber Number of the Block
 * @return {null}
 */
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
                    logger.log("Done verification of all the blocks, Need to run the job again after new block mining.");
                }
            }).catch(function(err){
                logger.error('\nNot able to fetch block number)\n', err);
                process.exit(1);
            }); 

    }, state.config.polling_interval );
}

setBlockVerifier(state.blockNumber);