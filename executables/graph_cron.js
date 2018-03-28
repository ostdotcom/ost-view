#!/usr/bin/env node
"use strict";
/**
 * Job to aggregate data for analytics and insert it into DB.
 *
 * @example
 * node executables/graph_cron.js -c 199
 * @example
 * node executables/graph_cron.js -h
 *
 * @module executables/graph_cron.js
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
 * To handle command line with format
 */
cliHandler
  .version(version)
  .usage('Please Specify chain ID \n$>graph_cron.js -c <chainID> ')
  .option('-c, --chainID <n>', 'Id of the chain', parseInt)
  .parse(process.argv);

// Check if chain id exits
if (!cliHandler.chainID) {
  logger.error('\n\tPlease Specify chain ID \n\t$>aggregator_cron.js -c <chainID>\n');
  process.exit(1);
}

// Set chain id and block number
state.chainID = cliHandler.chainID;

ProcessLocker.canStartProcess({process_title: 'v_cron_graph_c_' + cliHandler.chainID});

state.config = core_config.getChainConfig(state.chainID);
if (!state.config) {
  logger.error('\n\tInvalid chain ID \n');
  process.exit(1);
}

// Create required connections and objects
dbInteract = DbInteract.getInstance(state.config.chainId);
web3Interact = Web3Interact.getInstance(state.config.chainId);
dataAggregator = DataAggregator.newInstance(web3Interact, dbInteract, state.config.chainId);


dataAggregator.setUpCacheData()
  .then(function () {
    logger.log("Setting Up the CompanyData Cache Done");
    process.exit(1);
  });