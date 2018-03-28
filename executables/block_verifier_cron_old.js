#!/usr/bin/env node
"use strict";
/**
 * Job to verify fetched blocks and update in DB, if inconsistent
 *
 * @example
 * node executables/block_verifier_cron.js -c 1141
 * @example
 * node executables/block_verifier_cron.js -h
 *
 * @module executables/block_verifier_cron
 */

// Load external libraries
const cliHandler = require('commander')
    , ps = require('ps-node')
;

// Load internal files
const rootPrefix = ".."
    , Web3Interact = require(rootPrefix + "/lib/web3/interact/rpc_interact")
    , DbInteract = require(rootPrefix + "/lib/storage/interact")
    , logger = require(rootPrefix + "/helpers/custom_console_logger")
    , constants = require(rootPrefix + "/config/core_constants")
    , core_config = require(rootPrefix + "/config")
    , BlockVerifier = require(rootPrefix + "/lib/block_utils/block_verifier")
    , version = require(rootPrefix + '/package.json').version
    , maxRunTime = (2 * 60 * 60 * 1000) // 2 hrs in milliseconds
    , startRunTime = (new Date).getTime() // milliseconds since epoch
;

// Variables to hold different objects
var dbInteract
    , web3Interact
    , block_verifier;

const MIN_BLOCK_DIFF = Math.max(10, constants.FETCHER_BATCH_SIZE);
/**
 * Maintain the state run state
 * @type {hash}
 */
var state = {
    blockNumber: 0,
    chainID: null,
    config: null
};

var highestFetchedBlockNumber = null;
/**
 * Methods to set timeout for the verifyBlock api
 *
 * @param {Integer} blockNumber - Number of the Block
 * @return {null}
 */
var setBlockVerifier = function (blockNumber) {
    state.blockNumber = blockNumber;
    setTimeout(function () {
        if ((startRunTime + maxRunTime) > (new Date).getTime()) {

            if (highestFetchedBlockNumber != null && (+highestFetchedBlockNumber - MIN_BLOCK_DIFF > state.blockNumber)) {
                block_verifier.verifyBlock(state.blockNumber, setBlockVerifier);
            }
            else {
                dbInteract.getHighestInsertedBlock()
                    .then(function (resBlockNumber) {
                        logger.log("Higest Block Number ", resBlockNumber);

                        if (resBlockNumber != null && (+resBlockNumber - MIN_BLOCK_DIFF > state.blockNumber)) {
                            highestFetchedBlockNumber = resBlockNumber;
                            block_verifier.verifyBlock(state.blockNumber, setBlockVerifier);
                        } else {
                            //Need to set up the cron again.
                            logger.log("Done verification of all the blocks, Need to run the job again after new block mining.");
                            process.exit(1);
                        }
                    })
                    .catch(function (err) {
                        logger.error('\nNot able to fetch block number\n', err);
                        process.exit(1);
                    });
            }
        } else {
            process.exit(1);
        }
    }, state.config.poll_interval);
};

/**
 * To handle command line with format
 */
cliHandler
    .version(version)
    .usage('Please Specify chain ID \n$>node block_verifier_cron.js -c <chainID> ')
    .option('-c, --chainID <n>', 'Id of the chain', parseInt)
    .option('-n, --blockNumber <n>', 'Start parsing from given block number. If not passed, it start from last inserted block number', parseInt)
    .parse(process.argv);

// Check if chain id exits
if (!cliHandler.chainID) {
    logger.error('\n\tPlease Specify chain ID \n\t$>node block_verifier_cron.js -c <chainID>\n');
    process.exit(1);
}

// Set chain id and block number
state.chainID = cliHandler.chainID;
if (isNaN(cliHandler.blockNumber)) {
    state.blockNumber = 0;
} else {
    state.blockNumber = cliHandler.blockNumber;
}

// Handle process locking
const lockProcess = {
    command: 'node',
    script: 'block_verifier_cron.js',
    arguments: ['-c', state.chainID, '-n', state.blockNumber]
};

// Check if process with same arguments already running or not
ps.lookup({
    command: lockProcess.command,
    arguments: lockProcess.script + "," + lockProcess.arguments.join(",")
}, function (err, resultList) {
    if (err) {
        throw new Error(err);
    }

    resultList.forEach(function (r) {
        if (r) {
            logger.error('\n Process already exists with same arguments \n');
            process.exit(1);
        }
    });

    // Set process title for locking
    process.title = lockProcess.command + " " + lockProcess.script + " " + lockProcess.arguments.join(" ");
    logger.info(process.title);

    state.config = core_config.getChainConfig(state.chainID);
    if (!state.config) {
        logger.error('\n\tInvalid chain ID \n');
        process.exit(1);
    }

    // Create required connections and objects
    dbInteract = DbInteract.getInstance(state.config.chainId);
    web3Interact = Web3Interact.getInstance(state.config.chainId);
    block_verifier = BlockVerifier.newInstance(web3Interact, dbInteract, state.config.chainId);
    // logger.log('State Configuration', state);

    dbInteract.getLowestUnVerifiedBlockNumber()
        .then(function (blockNumber) {
            logger.log("Lowest Unverified Block Number ", blockNumber);
            if (state.blockNumber == 0 && blockNumber != null) {
                state.blockNumber = +blockNumber;
            }
            setBlockVerifier(state.blockNumber);
        })
        .catch(function (err) {
            logger.error('\nNot able to fetch block number)\n', err);
            process.exit(1);
        });
});