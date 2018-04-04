#!/usr/bin/env node
"use strict";
/**
 * Job to populate the tokens transactions data for addresses
 *
 * @example
 * node executables/populate_address_detail_cron.js -c 1141
 *
 * @module executables/populate_address_detail_cron
 */

const rootPrefix = "..";

// Include Process Locker File
const ProcessLockerKlass = require(rootPrefix + '/lib/process_locker')
  , ProcessLocker = new ProcessLockerKlass()
  , cliHandler = require('commander')
;

// Load internal files
const logger = require(rootPrefix + "/helpers/custom_console_logger")
  , constants = require(rootPrefix + "/config/core_constants")
  , config = require(rootPrefix + "/config")
  , PopulateAddressDetail = require(rootPrefix + "/lib/block_utils/populate_address_detail")
  , version = require(rootPrefix + '/package.json').version
  , BlockKlass = require(rootPrefix + "/app/models/block")
  , CronDetailKlass = require(rootPrefix + "/app/models/cron_detail")
;

// Variables to hold different objects
var populateAddressDetailObj;

const MIN_BLOCK_DIFF = Math.max(10, constants.FETCHER_BATCH_SIZE);
/**
 * Maintain the state chain Id
 * @type {Integer}
 */
var stateChainID = null;

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
 * Methods to set timeout for the repopulateBlock api
 *
 * @return {null}
 */
var initAddressDetailProcess = function (blockNumber, startFromIndex) {

  if (continueExecution) {

    if (highestFetchedBlockNumber != null && (+highestFetchedBlockNumber >= blockNumber)) {
      startAddressDetailProcess(blockNumber, startFromIndex);
    }
    else {
      new BlockKlass(stateChainID).getLastVerifiedBlockNumber()
        .then(function (resBlockNumber) {
          logger.log("higest verified Block Number ", resBlockNumber);

          if (resBlockNumber != null && (+resBlockNumber >= blockNumber)) {
            highestFetchedBlockNumber = resBlockNumber;
            startAddressDetailProcess(blockNumber, startFromIndex);
          } else {
            //Need to set up the cron again.
            logger.log("processed all the verified blocks. Need to run the job again after new blocks verified.");
            process.exit(1);
          }
        })
        .catch(function (err) {
          logger.error('\nNot able to fetch highest verified block number\n', err);
          process.exit(1);
        });
    }
  } else {
    logger.log("cannot start initAddressDetailProcess for  blockNumber/startFromIndex", blockNumber, startFromIndex);
    process.exit(1);
  }
};

var startAddressDetailProcess = function (blockNumber, startFromIndex) {

  populateAddressDetailObj.process(blockNumber, startFromIndex).then(function (response) {
    if (response.isSuccess()) {
      initAddressDetailProcess(response.data.blockNumber, response.data.startTransactionIndex)
    } else {
      logger.error('error in populate address details.\n response- ', response);
      process.exit(1);
    }
  }).catch(function (err) {
    logger.notify('e_padc_sadp_1', 'exception in startAddressDetailProcess',
      {
        blockNumber: blockNumber,
        startFromIndex: startFromIndex,
        err: err
      });
      process.exit(1);
  })

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

ProcessLocker.canStartProcess({process_title: 'v_cron_p_address_detail_c_' + cliHandler.chainID});
ProcessLocker.endAfterTime({time_in_minutes: 120});

// Set chain id
stateChainID = cliHandler.chainID;

if (!config.isValidChainId(stateChainID)) {
  logger.error('\nInvalid chain ID\n');
  process.exit(1);
}

populateAddressDetailObj = PopulateAddressDetail.newInstance(stateChainID);

const cronDetailObj = new CronDetailKlass(stateChainID);

cronDetailObj.select().where({cron_name: CronDetailKlass.address_detail_populate_cron}).fire()
  .then(function (cronDetailRow) {
    if (cronDetailRow[0]) {
      logger.log("cronDetailObj-", cronDetailRow[0]);
      var cronData = JSON.parse(cronDetailRow[0].data)
        , blockNumber = cronData.block_number
        , startFromIndex = cronData.start_from_index
      ;

      initAddressDetailProcess(blockNumber, startFromIndex);

    } else {
      logger.log("No row found in cron_details table for address_detail_populate_cron");
      process.exit(1);
    }
  })
  .catch(function (err) {
    logger.error('\nException while fetching cronDetailObj for address_detail_populate_cron\n', err);
    process.exit(1);
  });