#!/usr/bin/env node
"use strict";
/**
 * Job to aggregate data for analytics and insert it into DB.
 *
 * @example
 * node executables/aggregator_cron.js -c 199
 * @example
 * node executables/aggregator_cron.js -h
 *
 * @module executables/aggregator_cron.js
 */

const rootPrefix = "..";

// Load external libraries
// Include Process Locker File
const ProcessLockerKlass = require(rootPrefix + '/lib/process_locker')
  , ProcessLocker = new ProcessLockerKlass()
  , cliHandler = require('commander')
;

// Load internal files
const Web3Interact = require(rootPrefix + '/lib/web3/interact/rpc_interact')
  , DbInteract = require(rootPrefix + '/lib/storage/interact')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , core_config = require(rootPrefix + '/config')
  , constants = require(rootPrefix + '/config/core_constants')
  , DataAggregator = require(rootPrefix + '/lib/block_utils/data_aggregator')
  , version = require(rootPrefix + '/package.json').version
  , configHelper = require(rootPrefix + '/helpers/configHelper')
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

var continueExecution = true;

// Using a single function to handle multiple signals
function handle() {
  logger.info('Received Signal');
  continueExecution = false;
}

process.on('SIGINT', handle);
process.on('SIGTERM', handle);

/**
 * Methods to set timeout for the aggregate data api
 *
 * @param {Integer} timeId - timeId
 * @return {null}
 */
var aggregateByTimeId = function (timeId) {
  setTimeout(function () {
    if (continueExecution) {
      dbInteract.getLastVerifiedBlockTimestamp()
        .then(function (timestamp) {
          logger.log("Last Verified Block Timestamp ", timestamp);

          if (timestamp != null && +timestamp - timeId >= constants.AGGREGATE_CONSTANT) {
              configHelper.syncUpContractMap(dbInteract)
                .then(function () {
                  dataAggregator.aggregateData(timeId, aggregateByTimeId);
                });
          } else {
            //Need to set up the cron again.
            logger.log("Done aggregation of all the blocks, Need to run the job again after new block verification.");
            process.exit(1);
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
  .usage('Please Specify chain ID \n$>aggregator_cron.js -c <chainID> ')
  .option('-c, --chainID <n>', 'Id of the chain', parseInt)
  .parse(process.argv);

// Check if chain id exits
if (!cliHandler.chainID) {
  logger.error('\n\tPlease Specify chain ID \n\t$>aggregator_cron.js -c <chainID>\n');
  process.exit(1);
}

// Set chain id and block number
state.chainID = cliHandler.chainID;

ProcessLocker.canStartProcess({process_title: 'v_cron_block_aggregator_c_' + cliHandler.chainID });
ProcessLocker.endAfterTime({time_in_minutes: 120});

state.config = core_config.getChainConfig(state.chainID);
if (!state.config) {
  logger.error('\n\tInvalid chain ID \n');
  process.exit(1);
}

// Create required connections and objects
dbInteract = DbInteract.getInstance(state.config.chainId);
web3Interact = Web3Interact.getInstance(state.config.chainId);
dataAggregator = DataAggregator.newInstance(web3Interact, dbInteract, state.config.chainId);
// logger.log('State Configuration', state);

// GET LAST PROCESSED time id from a status table
dbInteract.getAggregateLastInsertedTimeId()
  .then(function (timeId) {
    logger.log("Last Aggregated time_id ", timeId);
    if (!timeId) {
      return dbInteract.getBlockFromBlockNumber(1)
        .then(function (block) {
          if (!block) {
            logger.log("#getBlockFromBlockNumber(1) returned is undefined");
            process.exit(1);
          }
          timeId = block.timestamp - (block.timestamp % constants.AGGREGATE_CONSTANT);
          logger.log("First timeId ", timeId);
          aggregateByTimeId(timeId);
        });
    } else {
      aggregateByTimeId(timeId + constants.AGGREGATE_CONSTANT);
    }
  })
  .catch(function (err) {
    logger.error('\nNot able to fetch last aggregated timestamp)\n', err);
    process.exit(1);
  });