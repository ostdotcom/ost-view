#!/usr/bin/env node
"use strict";
/**
 * Job to fetch blocks from the chain and feed them into the provided DB.
 *
 * @example
 * node executables/block_fetcher_cron.js -c 1141
 * @example
 * node executables/block_fetcher_cron.js -h
 *
 * @module executables/block_fetcher_cron
 */

const rootPrefix = "..";

// Load external libraries
// Include Process Locker File
const ProcessLockerKlass = require(rootPrefix + '/lib/process_locker')
  , ProcessLocker = new ProcessLockerKlass()
  , cliHandler = require('commander')
;

// Load internal files
const Web3Interact = require(rootPrefix + "/lib/web3/interact/rpc_interact")
  , DbInteract = require(rootPrefix + "/lib/storage/interact")
  , logger = require(rootPrefix + "/helpers/custom_console_logger")
  , core_config = require(rootPrefix + "/config")
  , BlockFetcher = require(rootPrefix + "/lib/block_utils/block_fetcher")
  , version = require(rootPrefix + '/package.json').version
;

// Variables to hold different objects
var dbInteract
  , web3Interact
  , block_fetcher;

/**
 * Maintain the state run state
 * @type {hash}
 */
var state = {
  chainID: null,
  blockNumber: -1,
  config: null,
  lastBlock: null
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
 * setFetchBlockCron
 *
 * Methods to set timeout for the fetchBlock api
 *
 * @param {Integer} blockNumber - Number of the block
 * @return {null}
 * @method setFetchBlockCron
 */
var setFetchBlockCron = function (blockNumber) {
  setTimeout(function () {
    if (continueExecution && (!state.lastBlock || (blockNumber < state.lastBlock))) {
      state.blockNumber = blockNumber;
      logger.log("Start fetchBlock for blockNumber", blockNumber);
      block_fetcher.fetchAndUpdateBlock(blockNumber, setFetchBlockCron);
    } else {
      logger.log("cannot start block fetching for blockNumber ", blockNumber);
      process.exit(1);
    }
  }, blockNumber === state.blockNumber ? 5000 : state.config.poll_interval);
};


/**
 * To handle command line with format
 * It picks up next last inserted block to start the fetching process if the blockNumber is not provided.
 */
cliHandler
  .version(version)
  .usage('Please Specify chain ID \n$>node block_fetcher_cron.js -c <chainID>')
  .option('-c, --chainID <n>', 'Id of the chain', parseInt)
  .option('-n, --blockNumber <n>', 'Start parsing from given block number. If not passed, it start from last inserted block number', parseInt)
  .option('-f, --firstBlock <n>', 'Start parsing from given block number. If not passed, it start from last inserted block number', parseInt)
  .option('-l, --lastBlock <n>', 'Start parsing from given block number. If not passed, it start from last inserted block number', parseInt)
  .parse(process.argv);

// Check if chain id exits
if (!cliHandler.chainID) {
  logger.error('\n\tPlease Specify chain ID \n\t$>node block_fetcher_cron.js -c <chainID>\n');
  process.exit(1);
}

var blockNumberToStartWith = -1;

// Set chain id and block number
state.chainID = cliHandler.chainID;
if (isNaN(cliHandler.blockNumber)) {
  blockNumberToStartWith = 0;
} else {
  blockNumberToStartWith = cliHandler.blockNumber;
}

if (cliHandler.firstBlock && cliHandler.lastBlock) {
  blockNumberToStartWith = cliHandler.firstBlock;
  state.lastBlock = cliHandler.lastBlock;
}

var processTitle = 'v_cron_block_fetcher_c_' + cliHandler.chainID;

if (cliHandler.blockNumber){
  processTitle += '_n_' + cliHandler.blockNumber;
}

if (cliHandler.firstBlock){
  processTitle += '_f_' + cliHandler.firstBlock;
}

if (cliHandler.lastBlock){
  processTitle += '_l_' + cliHandler.lastBlock;
}

ProcessLocker.canStartProcess({process_title: processTitle});
ProcessLocker.endAfterTime({time_in_minutes: 120});

state.config = core_config.getChainConfig(state.chainID);
if (!state.config) {
  logger.error('\n\tInvalid chain ID \n');
  process.exit(1);
}

// Create required connections and objects
dbInteract = DbInteract.getInstance(state.config.db_config);
web3Interact = Web3Interact.getInstance(state.config.chainId);
block_fetcher = BlockFetcher.newInstance(web3Interact, dbInteract, state.config.chainId, false);
block_fetcher.state.lastBlock = state.lastBlock;
// logger.log('State Configuration', state);

// Start processing blocks
if (!blockNumberToStartWith) {
  dbInteract.getHighestInsertedBlock()
    .then(function (blockNumber) {
      logger.log("Highest Block Number ", blockNumber);
      if (blockNumber) {
        blockNumberToStartWith = blockNumber + 1;
      } else {
        blockNumberToStartWith = 0;
      }
      setFetchBlockCron(blockNumberToStartWith);
    })
    .catch(function (err) {
      logger.error('\nNot able to fetch block number)\n', err);
      process.exit(1);
    });
}
else {
  setFetchBlockCron(blockNumberToStartWith);
}