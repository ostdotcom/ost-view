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
    , Web3Interact = require(rootPrefix + "/lib/web3/interact/rpc_interact")
    , DbInteract = require(rootPrefix + "/lib/storage/interact")
    , logger = require(rootPrefix + "/helpers/custom_console_logger")
    , core_config = require(rootPrefix + "/config")
    , constants = require(rootPrefix + "/config/core_constants")
    , DataAggregator = require(rootPrefix + "/lib/block_utils/dataAggregator")
    , version = require(rootPrefix + '/package.json').version
    , maxRunTime = (2 * 60 * 60 * 1000) // 2 hrs in milliseconds
    , startRunTime = (new Date).getTime() // milliseconds since epoch
    , configHelper = require(rootPrefix + "/helpers/configHelper")
    ;

// Variables to hold different objects
var dbInteract
    , web3Interact
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
 * Methods to set timeout for the aggregate data api
 *
 * @param {Integer} timeId - timeId
 * @return {null}
 */
var aggregateByTimeId = function ( timeId ) {
    setTimeout(function () {
        if ((startRunTime + maxRunTime) > (new Date).getTime()) {
            dbInteract.getLastVerifiedBlockTimestamp()
                .then(function (timestamp) {
                    logger.log("Last Verified Block Timestamp ", timestamp);
                    if (timestamp != null && +timestamp - timeId >= constants.AGGREGATE_CONSTANT) {
                        dataAggregator.aggregateData( timeId, aggregateByTimeId );
                    } else {
                        //Need to set up the cron again.
                        logger.log("Done aggregation of all the blocks, Need to run the job again after new block verification.");
                        logger.log("Setting Up the CompanyData Cache");
                        dataAggregator.setUpCacheData()
                            .then(function(){
                                logger.log("Setting Up the CompanyData Cache Done");
                                process.exit(1);
                            });
                    }
                })
                .catch(function (err) {
                    logger.error('\nNot able to fetch block timestamp\n', err);
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
    .usage('Please Specify chain ID \n$>aggregatorCron.js -c <chainID> ')
    .option('-c, --chainID <n>', 'Id of the chain', parseInt)
    .parse(process.argv);

// Check if chain id exits
if (!cliHandler.chainID) {
    logger.error('\n\tPlease Specify chain ID \n\t$>aggregatorCron.js -c <chainID>\n');
    process.exit(1);
}

// Set chain id and block number
state.chainID = cliHandler.chainID;

// Handle process locking
const lockProcess = {
    command: 'node',
    script: 'aggregatorCron.js',
    arguments: ['-p', state.chainID]
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
    web3Interact = Web3Interact.getInstance(state.config.chainId);
    dataAggregator = DataAggregator.newInstance(web3Interact, dbInteract, state.config.chainId);
    logger.log('State Configuration', state);

    dbInteract.getAggregateLastInsertedTimeId()
        .then(function (timeId) {
            logger.log("Last Aggregated time_id ", timeId);
            if ( null === timeId ) {
                dbInteract.initBrandedTokenTable()
                    .then(function(){
                        return configHelper.syncUpContractMap(dbInteract);
                    })
                    .then(function() {
                        return dbInteract.getBlockFromBlockNumber(1)
                    })
                    .then( function( block ) {
                        if (block == undefined){
                            logger.log("#getBlockFromBlockNumber(1) returned is undefined");
                            process.exit(1);
                        }
                        timeId = block.timestamp - (block.timestamp % constants.AGGREGATE_CONSTANT);
                        logger.log("First timeId ", timeId);
                        aggregateByTimeId( timeId );
                    });
            } else {
                configHelper.syncUpContractMap(dbInteract)
                    .then(function(){
                        aggregateByTimeId(timeId + constants.AGGREGATE_CONSTANT);
                    });
            }
        })
        .catch(function (err) {
            logger.error('\nNot able to fetch last aggregated timestamp)\n', err);
            process.exit(1);
        });
});