"use strict";

const rootPrefix = '../..'
  , baseCache = require(rootPrefix + '/lib/cache_management/base')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , GraphDataKlass = require(rootPrefix +'/app/models/graph_data')
  , AggregatedDataKlass = require(rootPrefix + '/app/models/aggregated')
;

/**
 * @constructor
 *
 * @param {Object} params - cache key generation & expiry related params
 *                 block_number -  Block number to fetch data for
 *                 chain_id - Chain id
 *
 */
const TokenTransferGraphData = function(params) {

  const oThis = this;

  oThis.chainId = params.chain_id;
  oThis.contractAddressId = params.contract_address_id;
  oThis.duration = params.duration;

  baseCache.call(this, params);

  oThis.useObject = true;

};

TokenTransferGraphData.prototype = Object.create(baseCache.prototype);

const TokenTransferGraphDataPrototype = {

  /**
   * set cache key
   *
   * @return {String}
   */
  setCacheKey: function() {

    const oThis = this;

    oThis.cacheKey = oThis._cacheKeyPrefix() + "ttgd_" + 'cid_' + oThis.contractAddressId + 'd_' + oThis.duration ;

    return oThis.cacheKey;

  },

  /**
   * set cache expiry in oThis.cacheExpiry and return it
   *
   * @return {Number}
   */
  setCacheExpiry: function() {

    const oThis = this;

    oThis.cacheExpiry = 86400; // 24 hours ;

    return oThis.cacheExpiry;

  },
  /**
   * fetch data from source
   *
   * @return {Result}
   */
  fetchDataFromSource: async function() {

    const oThis = this
    ;

    let graphDataObject;
    if (String(oThis.duration) !== 'Hour'){
      graphDataObject = new GraphDataKlass(oThis.chainId);
    } else {
      graphDataObject = new AggregatedDataKlass(oThis.chainId);
    }
    // graphDataObject.select('SUM(token)').where({contract_address_id: brandedTokenId, time_frame: oThis.invertedTimeFrame[timeFrame]})
    //   .group_by('time_id')
    //   .order_by('time_id')
    //   .limit(noOfRows)
    //   .fire();

    return Promise.resolve(responseHelper.successWithData(data));

  }


};

Object.assign(TokenTransferGraphData.prototype, TokenTransferGraphDataPrototype);

module.exports = TokenTransferGraphData;