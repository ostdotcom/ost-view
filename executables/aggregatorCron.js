#!/usr/bin/env node
"use strict";
/**
 * Job to aggregate data for analytics and insert it into DB.
 *
 * @example
 * node executables/aggregatorCron.js -c 1141
 * @example
 * node executables/aggregatorCron.js -h
 *
 * @module executables/aggregatorCron.js
 */

// Load external libraries
const cliHandler = require('commander')
    , ps = require('ps-node')
    ;

// Load internal files
const rootPrefix = ".."
    , DbInteract = require(rootPrefix + "/lib/storage/interact")
    , logger = require(rootPrefix + "/helpers/custom_console_logger")
    , core_config = require(rootPrefix + "/config")
    , DataAggregator = require(rootPrefix + "/lib/block_utils/dataAggregator")
    , version = require(rootPrefix + '/package.json').version
    , maxRunTime = (2 * 60 * 60 * 1000) // 2 hrs in milliseconds
    , startRunTime = (new Date).getTime() // milliseconds since epoch
    ;

// Variables to hold different objects
var dbInteract
    , dataAggregator;

/**
 * Maintain the state run state
 * @type {hash}
 */
var state = {
    chainID: null,
    config: null
};

/**
 * Methods to set timeout for the verifyBlock api
 *
 * @param {Integer} blockNumber - Number of the Block
 * @return {null}
 */
var aggregateData = function (blockNumber) {
    setTimeout(function () {
        if ((startRunTime + maxRunTime) > (new Date).getTime()) {
            dbInteract.getHigestInsertedBlock()
                .then(function (resBlockNumber) {
                    logger.log("Higest Block Number ", resBlockNumber);
                    if (resBlockNumber != null && +resBlockNumber - 10 > state.blockNumber) {
                        block_verifier.verifyBlock(blockNumber, aggregateData);
                    } else {
                        //Need to set up the cron again.
                        logger.log("Done verification of all the blocks, Need to run the job again after new block mining.");
                    }
                })
                .catch(function (err) {
                    logger.error('\nNot able to fetch block number\n', err);
                    process.exit(1);
                });
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
    script: 'aggregatorCron.js',
    arguments: ['-c', state.chainID]
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
    dbInteract = DbInteract.getInstance(state.config.db_config);
    dataAggregator = DataAggregator.newInstance( dbInteract, state.config.chainId);
    logger.log('State Configuration', state);

    dbInteract.getLastAggregatedBlockNumber()
        .then(function (blockNumber) {
            logger.log("Last Aggregated Block Number ", blockNumber);
            aggregateData(blockNumber );
        })
        .catch(function (err) {
            logger.error('\nNot able to fetch block number)\n', err);
            process.exit(1);
        });
});