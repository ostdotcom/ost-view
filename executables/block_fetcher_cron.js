#!/usr/bin/env node
"use strict"
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
const cliHandler = require('commander');

// Load internal files
const rootPrefix = ".."
  , Web3Interact = require(rootPrefix + "/lib/web3/interact/rpc_interact")
  , DbInteract = require(rootPrefix + "/helpers/db/interact")
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
  blockNumber: 0,
  config: null
};

/**
 * setFetchBlockCron
 *
 * Methods to set timeout for the fetchBlock api
 *
 * @param  {Integer} blockNumber Number of the block
 * @return {null}
 * @method setFetchBlockCron
 */
var setFetchBlockCron = function (blockNumber) {
  setTimeout(function () {
    block_fetcher.fetchAndUpdateBlock(blockNumber, setFetchBlockCron);
  }, state.config.polling_interval);
}

/**
 * To handle command line with format
 * It picks up next last inserted block to start the fetching process if the blockNumber is not provided.
 */
cliHandler
  .version(version)
  .usage('Please Specify chain ID \n$>node block_fetcher_cron.js -c <chainID>')
  .option('-c, --chainID <n>', 'Id of the chain', parseInt)
  .option('-n, --blockNumber <n>', 'Start parsing from given block number. If not passed, it start from last inserted block number', parseInt)
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
    logger.error('\n\tInvalid chain ID \n');
    process.exit(1);
  }
} else {
  logger.error('\n\tPlease Specify chain ID \n\t$>node block_fetcher_cron.js -c <chainID>\n');
  process.exit(1);
}

dbInteract.getHigestInsertedBlock()
  .then(function (blockNumber) {
    logger.log("Highest Block Number ", blockNumber);
    if (block_fetcher.state.blockNumber == 0 && blockNumber != null) {
      block_fetcher.state.blockNumber = +blockNumber + 1;
    }
    setFetchBlockCron(block_fetcher.state.blockNumber);
  }).catch(function (err) {
  logger.error('\nNot able to fetch block number)\n', err);
  process.exit(1);
});

