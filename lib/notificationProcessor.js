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
  , TokenUnits = require(rootPrefix + "/helpers/tokenUnits")
  ;

/**
 * Constructor to create object of NotificationProcessor

 * @constructor
 */
var NotificationProcessor = function () {

};

/**
 * Processes Transaction event which provided its type
 * @param msgPayload Message Payload
 * @returns {*}
 */
NotificationProcessor.prototype.processTransaction = function (msgPayload) {
  if (undefined == config.getChainDbConfig(parseInt(msgPayload.chain_id))) {
    logger.log("Not able to retrieve db config for chain Id", parseInt(msgPayload.chain_id));
    return Promise.resolve();
  }

  var dbInteract = DbInteract.getInstance(config.getChainDbConfig(parseInt(msgPayload.chain_id)));
  var contractAddress = msgPayload.erc20_contract_address;
  var transactionHash = msgPayload.transaction_hash;
  var tag = msgPayload.tag;
  if (!contractAddress) {
    logger.log("NotificationProcessor#processTransaction :: contractAddress is not defined");
    return Promise.resolve();
  }
  if (!tag) {
    logger.log("NotificationProcessor#processTransaction :: Tag not defined for transaction hash", transactionHash);
    return Promise.resolve();
  }
  contractAddress = contractAddress.toLowerCase();
  return dbInteract.insertIntoTransactionType({
    contract_address: contractAddress,
    transaction_hash: transactionHash,
    tag: tag
  });
};

/**
 * Processes Branded token event which provides branded token updated details.
 * @param msgPayload Message Payload
 */
NotificationProcessor.prototype.processBrandedTokenEvent = function (msgPayload) {
  if (undefined == config.getChainDbConfig(parseInt(msgPayload.identifier.chain_id))) {
    logger.log("Not able to retrieve db config for chain Id", parseInt(msgPayload.chain_id));
    return Promise.resolve();
  }
  var dbInteract = DbInteract.getInstance(config.getChainDbConfig(parseInt(msgPayload.identifier.chain_id)));
  var contractAddress = msgPayload.identifier.erc20_contract_address;

  var data = msgPayload.data;
  if (!contractAddress) {
    logger.log("NotificationProcessor#processBrandedTokenEvent :: erc20_contractAddress is not defined");
    return Promise.resolve();
  }
  if (!data) {
    logger.log("NotificationProcessor#processBrandedTokenEvent :: data is not defined");
    return Promise.resolve();
  }
  contractAddress = contractAddress.toLowerCase();
  var oThis = this;
  oThis.formatCompanyData = function (hash) {
    var formattedData = [];
      var row = [];
      row.push(hash.id);
      row.push(hash.company_name);
      row.push(hash.contract_address);
      row.push(hash.company_symbol);
      row.push(hash.uuid);
      row.push(hash.price);
      row.push(hash.token_holders);
      row.push(hash.market_cap);
      row.push(hash.circulation);
      row.push(hash.total_supply);
      row.push(JSON.stringify(hash.transactions_data));
      row.push(JSON.stringify(hash.transactions_volume_data));
      row.push(JSON.stringify(hash.tokens_transfer_data));
      row.push(JSON.stringify(hash.tokens_volume_data));
      row.push(JSON.stringify(hash.transaction_type_data));
      row.push(hash.token_transfers);
      row.push(hash.token_ost_volume);
      row.push(hash.creation_time);
      row.push(hash.symbol_icon);
      formattedData.push(row);
      return formattedData;
  };

  return dbInteract.getCoinFromContractAddress(contractAddress)
    .then(function (response) {
      if (!response) {
        return dbInteract.numberOfRowsInBrandedTokenTable()
          .then(function (noOfRows) {
            return Promise.resolve(noOfRows);
          })
          .then(function (noOfRows) {
            response = {};
            response.id = noOfRows;
            response.company_name = "";
            response.contract_address = contractAddress;
            response.company_symbol = "";
            response.uuid = "";
            response.price = 0;
            response.token_holders = 0;
            response.market_cap = 0;
            response.circulation = 0;
            response.total_supply = 0;
            response.transactions_data = null;
            response.transactions_volume_data = null;
            response.tokens_transfer_data = null;
            response.tokens_volume_data = null;
            response.transaction_type_data = null;
            response.token_transfers = 0;
            response.token_ost_volume = 0;
            response.creation_time = 0;
            response.symbol_icon = null;
            if (data.name) {
              response.company_name = data.name;
            }
            if (data.symbol) {
              response.company_symbol = data.symbol;
            }
            if (data.symbol_icon) {
              response.symbol_icon = data.symbol_icon;
            }
            if (data.ost_to_bt_conversion_factor) {
              response.price = data.ost_to_bt_conversion_factor;
            }
            return dbInteract.insertOrUpdateCompanyDataArray(oThis.formatCompanyData(response));
          });
      }
      if (data.name) {
        response.company_name = data.name;
      }
      if (data.symbol) {
        response.company_symbol = data.symbol;
      }
      if (data.symbol_icon) {
        response.symbol_icon = data.symbol_icon;
      }
      if (data.ost_to_bt_conversion_factor) {
        response.price = data.ost_to_bt_conversion_factor;
      }
      return dbInteract.insertOrUpdateCompanyDataArray(oThis.formatCompanyData(response));
    });
};

module.exports = new NotificationProcessor();
