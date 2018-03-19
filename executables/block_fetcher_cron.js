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
  , BlockFetcher = require(rootPrefix + "/lib/block_utils/block_fetcher")
  , version = require(rootPrefix + '/package.json').version
  , maxRunTime = (2 * 60 * 60 * 1000) // 2 hrs in milliseconds
  , startRunTime = (new Date).getTime() // milliseconds since epoch
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
  blockNumber: 0,
  config: null,
  lastBlock: null
};

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
    if (((startRunTime + maxRunTime) > (new Date).getTime()) && (!state.lastBlock || (blockNumber < state.lastBlock))) {
      state.blockNumber = blockNumber;
      logger.log("Start fetchBlock for blockNumber", blockNumber);
      block_fetcher.fetchAndUpdateBlock(blockNumber, setFetchBlockCron);
    } else {
      logger.log("Completion of block fetching done for blockNumber ", blockNumber);
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

// Set chain id and block number
state.chainID = cliHandler.chainID;
if (isNaN(cliHandler.blockNumber)) {
  state.blockNumber = 0;
} else {
  state.blockNumber = cliHandler.blockNumber;
}

if (cliHandler.firstBlock && cliHandler.lastBlock) {
  state.blockNumber = cliHandler.firstBlock;
  state.lastBlock = cliHandler.lastBlock;
}

// console.log("First block : ", state.blockNumber, "Second Block :",state.lastBlock);
// Handle process locking
const lockProcess = {
  command: 'node',
  script: 'block_fetcher_cron.js',
  arguments: ['-c', state.chainID, '-n', state.blockNumber]
};

//Check if process with same arguments already running or not
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
  block_fetcher = BlockFetcher.newInstance(web3Interact, dbInteract, state.config.chainId, false);
  block_fetcher.state.lastBlock = state.lastBlock;
  logger.log('State Configuration', state);

  // Start processing blocks
  if (!state.blockNumber) {
    dbInteract.getHighestInsertedBlock()
      .then(function (blockNumber) {
        logger.log("Highest Block Number ", blockNumber);
        if (blockNumber) {
          state.blockNumber = blockNumber + 1;
        }else{
          state.blockNumber = 0;
        }
        setFetchBlockCron(state.blockNumber);
      })
      .catch(function (err) {
        logger.error('\nNot able to fetch block number)\n', err);
        process.exit(1);
      });
  }
  else {
    setFetchBlockCron(state.blockNumber);
  }
});