"use strict";

const rootPrefix = "../../.."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstant = require(rootPrefix + '/config/core_constants')
  , AddressesIdMapCacheKlass = require(rootPrefix + '/lib/cache_multi_management/addressIdMap.js')
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
const GeTransactionTypeGraphKlass = function(params){
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

    const response  = await new AddressesIdMapCacheKlass({chain_id: oThis.chainId, addresses:[oThis.contractAddress]}).fetch()
      , responseData = response.data;
    if (response.isFailure() || !responseData[oThis.contractAddress]){
      throw "GeTransactionTypeGraphKlass :: AddressesIdMapCacheKlass :: response Failure Or contract Address not found ::" + oThis.contractAddress;
    }

    const contractAddressId = responseData[oThis.contractAddress];

    //TODO: fetch graph data
    return Promise.resolve(responseHelper.successWithData());
  }
};

module.exports = GeTransactionTypeGraphKlass;