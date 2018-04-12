"use strict";

const rootPrefix = "../../.."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , AddressesIdMapCacheKlass = require(rootPrefix + '/lib/cache_multi_management/addressIdMap')
  , TransactionTypeGraphCacheKlass = require(rootPrefix + '/lib/cache_management/transaction_type_graph_data')
  , CronDetailsModelKlass = require(rootPrefix + '/app/models/cron_detail')
  , cronDetailConst = require(rootPrefix + '/lib/global_constant/cron_details')
  , constants = require(rootPrefix + '/config/core_constants')
;

/**
 * Get transaction type for a branded token
 *
 * @param {object} params - this is object with keys.
 *                 chainId - Chain Id.
 *                 contractAddress - contract address of branded token
 *
 * @Constructor
 */
const GeTransactionTypeGraphKlass = function (params) {
  const oThis = this;

  oThis.chainId = params.chainId;
  oThis.contractAddress = params.contractAddress;
  oThis.duration = params.duration;
};


GeTransactionTypeGraphKlass.prototype = {

  // check address id is never 0
  //use same service for get token graph data

  /**
   * Perform operation of getting recent token transfers details
   *
   * @return {Promise<void>}
   */
  perform: async function () {
    const oThis = this;

    let contractAddressId = 0;

    try {
      //Check for common data
      const response = await new AddressesIdMapCacheKlass({
        chain_id: oThis.chainId,
        addresses: [oThis.contractAddress]
      }).fetch()
        , responseData = response.data;
      if (response.isFailure() || !responseData[oThis.contractAddress]) {
        return Promise.resolve(responseHelper.error("a_s_tbt_2", "GeTransactionTypeGraphKlass :: AddressesIdMapCacheKlass :: response Failure Or contract Address not found ::" + oThis.contractAddress));
      }
      contractAddressId = responseData[oThis.contractAddress].id;



      const cronDetailsRow = await (new CronDetailsModelKlass(oThis.chainId)).select('*').where(["cron_name = ?", CronDetailsModelKlass.aggregator_cron]).order_by('id DESC').limit(1).fire()
        , cronRow = cronDetailsRow[0]
      ;
      let latestTimestamp = 0;
      if (cronRow) {
        let blockData = JSON.parse(cronRow.data);
        if (blockData.block_timestamp) {
          if (Number(cronRow.status) === Number(new CronDetailsModelKlass(oThis.chainId).invertedStatuses[cronDetailConst.completeStatus])) {
            latestTimestamp = blockData.block_timestamp + constants.AGGREGATE_CONSTANT;
          } else {
            latestTimestamp = blockData.block_timestamp;
          }
        }
      }


      const transactionTypeGraphResponse = await new TransactionTypeGraphCacheKlass({
        chain_id: oThis.chainId,
        contract_address_id: contractAddressId,
        duration: oThis.duration,
        latestTimestamp: latestTimestamp
      }).fetch();

      if (transactionTypeGraphResponse.isFailure()) {
        return Promise.resolve(responseHelper.error("a_s_tbt_1", "Fail to fetch graph data for transaction type"));
      }
      return Promise.resolve(responseHelper.successWithData(transactionTypeGraphResponse.data));
    } catch (err) {
      return Promise.resolve(responseHelper.error("a_s_tbt_2", "Fail to fetch graph data for transaction type " + err));
    }
  }

};

module.exports = GeTransactionTypeGraphKlass;

/*
  TokenType = require('./app/services/token_details/get_transaction_by_type')
 new TokenType({chainId : 1409, contractAddressId: 35, duration: 'hour'}).perform().then(console.log);
 */