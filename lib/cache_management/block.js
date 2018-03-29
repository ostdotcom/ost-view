"use strict";

const rootPrefix = '../..'
    , baseCache = require(rootPrefix + '/lib/cache_management/base')
    , BlockModelKlass = require(rootPrefix + '/app/models/block')
    , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * @constructor
 * @augments BlockCacheKlass
 *
 * @param {Object} params - cache key generation & expiry related params
 *
 */
const BlockCacheKlass = function(params) {

  const oThis = this;

  oThis.blockNumber = params['block_number'];
  oThis.chainId = params['chain_id'];

  baseCache.call(this, params);

  oThis.useObject = true;

};

BlockCacheKlass.prototype = Object.create(baseCache.prototype);

const BlockCacheKlassPrototype = {

  /**
   * set cache key
   *
   * @return {String}
   */
  setCacheKey: function() {

    const oThis = this;

    oThis.cacheKey = oThis._cacheKeyPrefix() + "bn_" + oThis.blockNumber ;

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
      , blockObject = new BlockModelKlass(oThis.chainId)
      ;

      const blockData = await blockObject.select('id, block_number, block_hash, gas_used, total_transactions, block_timestamp, status')
                .where(["block_number = ?", oThis.blockNumber]).fire();

    if(!blockData[0]){
      return Promise.resolve((responseHelper.error('cm_bn_1', 'Block data not found.')));
    }

    return Promise.resolve(responseHelper.successWithData(blockData[0]));

  }


};

Object.assign(BlockCacheKlass.prototype, BlockCacheKlassPrototype);

module.exports = BlockCacheKlass;