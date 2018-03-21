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

const rootPrefix = "..";

// Include Process Locker File
const ProcessLockerKlass = require(rootPrefix + '/lib/process_locker')
  , ProcessLocker = new ProcessLockerKlass()
  , cliHandler = require('commander')
;

// Load internal files
const Web3Interact = require(rootPrefix + "/lib/web3/interact/rpc_interact")
  , DbInteract = require(rootPrefix + "/lib/storage/interact")
  , logger = require(rootPrefix + "/helpers/custom_console_logger")
  , constants = require(rootPrefix + "/config/core_constants")
  , core_config = require(rootPrefix + "/config")
  , BlockVerifier = require(rootPrefix + "/lib/block_utils/block_verifier")
  , version = require(rootPrefix + '/package.json').version
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

var highestFetchedBlockNumber = null;

/**
 * Methods to set timeout for the verifyBlock api
 *
 * @return {null}
 */
var checkUnverifiedBlock = function () {
  setTimeout(async function () {

    if (continueExecution) {

      var blockNumber = await dbInteract.getLowestUnVerifiedBlockNumber()
        .then(function (unverifiedBlockNumber) {
          logger.log("Lowest Unverified Block Number ", unverifiedBlockNumber);
          if (unverifiedBlockNumber != null) {
            return +unverifiedBlockNumber;
          } else {
            logger.error('\nNot able to fetch block number)\n');
            process.exit(1);
          }
        })
        .catch(function (err) {
          logger.error('\nNot able to fetch block number catch called)\n', err);
          process.exit(1);
        });

      setBlockVerifier(blockNumber);

    } else {
      process.exit(1);
    }

  }, state.config.poll_interval);
};
/**
 * Methods to set timeout for the verifyBlock api
 *
 * @return {null}
 */
var setBlockVerifier = function (blockNumber) {

  if (highestFetchedBlockNumber != null && (+highestFetchedBlockNumber - MIN_BLOCK_DIFF > blockNumber)) {
    block_verifier.verifyBlock(blockNumber, checkUnverifiedBlock);
  }
  else {
    dbInteract.getHighestInsertedBlock()
      .then(function (resBlockNumber) {
        logger.log("Higest Block Number ", resBlockNumber);

        if (resBlockNumber != null && (+resBlockNumber - MIN_BLOCK_DIFF > blockNumber)) {
          highestFetchedBlockNumber = resBlockNumber;
          block_verifier.verifyBlock(blockNumber, checkUnverifiedBlock);
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
};

/**
 * To handle command line with format
 */
cliHandler
  .version(version)
  .usage('Please Specify chain ID \n$>node block_verifier_cron.js -c <chainID> ')
  .option('-c, --chainID <n>', 'Id of the chain', parseInt)
  .parse(process.argv);

// Check if chain id exits
if (!cliHandler.chainID) {
  logger.error('\n\tPlease Specify chain ID \n\t$>node block_verifier_cron.js -c <chainID>\n');
  process.exit(1);
}

ProcessLocker.canStartProcess({process_title: 'v_cron_block_verifier_c_' + cliHandler.chainID});
ProcessLocker.endAfterTime({time_in_minutes: 120});

// Set chain id and block number
state.chainID = cliHandler.chainID;

state.config = core_config.getChainConfig(state.chainID);
if (!state.config) {
  logger.error('\n\tInvalid chain ID \n');
  process.exit(1);
}

// Create required connections and objects
dbInteract = DbInteract.getInstance(state.config.db_config);
web3Interact = Web3Interact.getInstance(state.config.chainId);
block_verifier = BlockVerifier.newInstance(web3Interact, dbInteract, state.config.chainId);

checkUnverifiedBlock();