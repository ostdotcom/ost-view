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

// Load internal files
const rootPrefix = ".."
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , ProcessLockerKlass = require(rootPrefix + '/lib/process_locker')
  , config = require(rootPrefix + '/config')
  , constants = require(rootPrefix + '/config/core_constants')
  , GraphDataBuilder = require(rootPrefix + '/lib/block_utils/graph_data_builder')
  , CronDetailsModelKlass = require(rootPrefix + '/app/models/cron_detail')
  , cronDetailConst = require(rootPrefix + '/lib/global_constant/cron_details')
  , version = require(rootPrefix + '/package.json').version
;

// Load external libraries
// Include Process Locker File
const ProcessLocker = new ProcessLockerKlass()
  , cliHandler = require('commander')
;


/*
  Use cases
  Graph cron accept only chain Id.
  Graph cron update last run time_id in cron table.
  Graph cron query aggregator_cron's completed status of block timestamp, for latest timeId.
 */


function startGraphCron(chainId) {
  // GET LAST PROCESSED time id from a status table
  new CronDetailsModelKlass(chainId).select('*').where(["cron_name = ?", CronDetailsModelKlass.aggregator_cron]).order_by('id DESC').limit(1).fire()
    .then(function (cronDetailRows) {
      let cronRow = cronDetailRows[0];
      if (cronRow && (cronRow.status == new CronDetailsModelKlass(chainId).invertedStatuses[cronDetailConst.completeStatus])) {
        let blockData = JSON.parse(cronRow.data);
        let latestTimestamp = blockData.block_timestamp + constants.AGGREGATE_CONSTANT;
        GraphDataBuilder.newInstance(chainId, latestTimestamp).perform()
          .then(function () {
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
}


(function (args) {

  let chainID = null;

  //To handle command line with format
  cliHandler
    .version(version)
    .usage('Please Specify chain ID \n$>graph_cron.js -c <chainID> ')
    .option('-c, --chainID <n>', 'Id of the chain', parseInt)
    .parse(args);

  // Check if chain id exits
  if (!cliHandler.chainID) {
    logger.error('\n\tPlease Specify chain ID \n\t$>graph_cron.js -c <chainID>\n');
    process.exit(1);
  }

  // Set chain id and block number
  chainID = cliHandler.chainID;

  ProcessLocker.canStartProcess({process_title: 'v_cron_graph_c_' + cliHandler.chainID});

  if (!config.isValidChainId(chainID)) {
    logger.error('\n\tInvalid chain ID \n');
    process.exit(1);
  }

  startGraphCron(chainID);

})(process.argv);