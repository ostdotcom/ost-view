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
const logger = require(rootPrefix + '/helpers/custom_console_logger')
  , config = require(rootPrefix + '/config')
  , constants = require(rootPrefix + '/config/core_constants')
  , version = require(rootPrefix + '/package.json').version
  , BlockModelKlass = require(rootPrefix + '/app/models/block')
  , AggregateDataKlass = require(rootPrefix + '/lib/block_utils/aggregate_data')
  , CronDetailsModelKlass = require(rootPrefix + '/app/models/cron_detail')
  , cronDetailConst = require(rootPrefix + '/lib/global_constant/cron_details')
  , AggregatedModelKlass = require(rootPrefix + '/app/models/aggregated')
;

/**
 * Maintain the state run state
 * @type {hash}
 */
var state = {
  chainID: null,
  cronDetailId: null
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
  if (continueExecution) {
    new BlockModelKlass(state.chainID).getLastVerifiedBlockTimestamp()
      .then(async function (timestamp) {
        logger.log("Last Verified Block Timestamp ", timestamp);
        logger.log("Input timestamp ", timeId);
        if (timestamp != null && (timestamp - timeId >= constants.AGGREGATE_CONSTANT)) {
          let cdmObj = new CronDetailsModelKlass(state.chainID);

          await cdmObj.update({data: JSON.stringify({block_timestamp: timeId}),
            status: cdmObj.invertedStatuses[cronDetailConst.pendingStatus]})
            .where(['cron_name = ?', CronDetailsModelKlass.aggregator_cron])
            .fire();
          AggregateDataKlass.newInstance(state.chainID, timeId).perform()
            .then(function(response){
              // Update Cron details once cron is completed.
              let obj = new CronDetailsModelKlass(state.chainID)
                , cronstatus = obj.invertedStatuses[cronDetailConst.failedStatus];
              if(response.isSuccess()){
                cronstatus = obj.invertedStatuses[cronDetailConst.completeStatus];
              }
              obj.update({status: cronstatus}).where(['cron_name = ?', CronDetailsModelKlass.aggregator_cron])
                .fire()
                .then(function(resp){

                  if (cronstatus == 2){
                    aggregateByTimeId(timeId + constants.AGGREGATE_CONSTANT)
                  }else {
                    process.exit(1);
                  }
                });
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


// todo: use logic as in populate_address_detail
// initial row in migration
// only one row in table


// GET LAST PROCESSED time id from a status table
new CronDetailsModelKlass(state.chainID).select('*').where(["cron_name = ?", CronDetailsModelKlass.aggregator_cron]).fire()
  .then(function (cronDetailRows) {
    let cronRow = cronDetailRows[0];
    if (!cronRow) {
      logger.notify('e_ac_1', 'Aggregator cron row entry not available.');
      process.exit(1);

    } else if(cronRow.status == new CronDetailsModelKlass(state.chainID).invertedStatuses[cronDetailConst.completeStatus]){
      let blockData = JSON.parse(cronRow.data);
      if (blockData.block_timestamp < 1){
        startAggregatorFromFirstBlock();
      } else{
        aggregateByTimeId(blockData.block_timestamp + constants.AGGREGATE_CONSTANT);
      }
    } else if(cronRow.status == new CronDetailsModelKlass(state.chainID).invertedStatuses[cronDetailConst.pendingStatus]){

      logger.notify('e_ac_2', 'Aggregator cron row entry having status pending');
      process.exit(1);
    }
    else {
      // If last cron is not completed or failed then delete last aggregated data of that time & run it again.
      let blockData = JSON.parse(cronRow.data);

      deleteAggregatedData(blockData)
        .then(function (response) {
          aggregateByTimeId(blockData.block_timestamp);

        })
        .catch(function () {

        });
    }
  })
  .catch(function (err) {
    logger.error('\nNot able to fetch last aggregated timestamp)\n', err);
    process.exit(1);
  });

function deleteAggregatedData(blockData) {
  console.log('deleting aggregated data :',blockData.block_timestamp);
  return new AggregatedModelKlass(state.chainID).delete().where(["timestamp=?", blockData.block_timestamp]).fire()
}

function startAggregatorFromFirstBlock() {
  return new BlockModelKlass(state.chainID).select('*').where(["block_number=?", 1]).fire()
    .then(function (blockArr) {
      let block = blockArr[0];
      if (!block) {
        logger.log("#getBlockFromBlockNumber(1) returned is undefined");
        process.exit(1);
      }
      let timeId = block.block_timestamp - (block.block_timestamp % constants.AGGREGATE_CONSTANT);
      logger.log("First Block timestamp ", block.block_timestamp);
      logger.log("First timeId ", timeId);
      aggregateByTimeId(timeId);
    });
}