"use strict";

const rootPrefix = "../../.."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstant = require(rootPrefix + '/config/core_constants')
  , AddressesIdMapCacheKlass = require(rootPrefix + '/lib/cache_multi_management/addressIdMap')
  , TransactionTypeGraphCacheKlass = require(rootPrefix + '/lib/cache_management/transaction_type_graph_data')
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
        throw "GeTransactionTypeGraphKlass :: AddressesIdMapCacheKlass :: response Failure Or contract Address not found ::" + oThis.contractAddress;
      }
      contractAddressId = responseData[oThis.contractAddress].id;


      const transactionTypeGraphResponse = await new TransactionTypeGraphCacheKlass({
        chain_id: oThis.chainId,
        contract_address_id: contractAddressId,
        duration: oThis.duration
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