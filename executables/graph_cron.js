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
const logger = require(rootPrefix + '/helpers/custom_console_logger')
  , config = require(rootPrefix + '/config')
  , constants = require(rootPrefix + '/config/core_constants')
  , GraphDataBuilder = require(rootPrefix + '/lib/block_utils/graph_data_builder')
  , CronDetailsModelKlass = require(rootPrefix + '/app/models/cron_detail')
  , cronDetailConst = require(rootPrefix + '/lib/global_constant/cron_details')
  , version = require(rootPrefix + '/package.json').version
  ;


/**
 * Maintain the state run state
 * @type {hash}
 */
const state = {
  chainID: null,
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

if (!config.isValidChainId(state.chainID)) {
  logger.error('\n\tInvalid chain ID \n');
  process.exit(1);
}

// GET LAST PROCESSED time id from a status table
new CronDetailsModelKlass(state.chainID).select('*').where(["cron_name = ?", CronDetailsModelKlass.aggregator_cron]).order_by('id DESC').limit(1).fire()
  .then(function (cronDetailRows) {
    let cronRow = cronDetailRows[0];
    if (cronRow && (cronRow.status == new CronDetailsModelKlass(state.chainID).invertedStatuses[cronDetailConst.completeStatus])) {
      let blockData = JSON.parse(cronRow.data);
      let latestTimestamp = blockData.block_timestamp + constants.AGGREGATE_CONSTANT;
      GraphDataBuilder.newInstance(state.chainID, latestTimestamp).perform()
        .then(function(){
          logger.log('\nGraph Build for latestTimestamp ', latestTimestamp);
          process.exit(1);
        });
    } else {
      logger.log('\nNo data in CronDetailsModelKlass\n');
      process.exit(1);
    }
  })
  .catch(function (err) {
    logger.error('\nNot able to fetch data from CronDetailsModelKlass\n', err);
    process.exit(1);
  });