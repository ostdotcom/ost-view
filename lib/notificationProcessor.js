"use strict";
/**
 * Notification Processor
 *
 * @module lib/notificationProcessor
 */
const rootPrefix = ".."
    , logger = require(rootPrefix + "/helpers/custom_console_logger")
    , constants = require(rootPrefix + "/config/core_constants")
    , config = require(rootPrefix + "/config")
    , DbInteract = require(rootPrefix + "/lib/storage/interact")
    ;

/**
 * Constructor to create object of NotificationProcessor

 * @constructor
 */
var NotificationProcessor = function () {

};

NotificationProcessor.prototype.processBTCreation = function(msgPayload) {
    if (undefined == config.getChainDbConfig(msgPayload.chainId)) {
        logger.log("Not able to retrive db config for chain Id",msgPayload.chainId);
        process.exit(1);
    }

    var dbInteract = DbInteract.getInstance(config.getChainDbConfig(msgPayload.chainId));
    var btDetails = msgPayload.bt_details;

    return dbInteract.numberOfRowsInBrandedTokenTable()
        .then(function(noOfRows){
            var dataRow = [];
            dataRow.push(noOfRows);
            dataRow.push(btDetails._name);
            dataRow.push(btDetails._token);
            dataRow.push(btDetails._symbol);
            dataRow.push(btDetails._uuid);
            dataRow.push(btDetails._conversionRate);
            dataRow.push(0);
            dataRow.push(0);
            dataRow.push(0);
            dataRow.push(0);
            dataRow.push(null);
            dataRow.push(null);
            dataRow.push(null);
            dataRow.push(null);
            return dbInteract.insertOrUpdateCompanyDataArray([dataRow]);
        });
};

module.exports = new NotificationProcessor();
