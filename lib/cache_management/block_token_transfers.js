"use strict";

const rootPrefix = '../..'
    , baseCache = require(rootPrefix + '/lib/cache_management/base')
    , TokenTransferModelKlass = require(rootPrefix + '/app/models/token_transfer')
    , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * @constructor
 * @augments BlockTokenTransferCacheKlass
 *
 * @param {Object} params - cache key generation & expiry related params
 *
 */
const BlockTokenTransferCacheKlass = function(params) {

  const oThis = this;

  oThis.blockNumber = params['block_number'];
  oThis.chainId = params['chain_id'];

  baseCache.call(this, params);

  oThis.useObject = true;

};

BlockTokenTransferCacheKlass.prototype = Object.create(baseCache.prototype);

const BlockTokenTransferCacheKlassPrototype = {

  /**
   * set cache key
   *
   * @return {String}
   */
  setCacheKey: function() {

    const oThis = this;

    oThis.cacheKey = oThis._cacheKeyPrefix() + "bn_tt_" + oThis.blockNumber ;

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
      , tokenTransfersObject = new TokenTransferModelKlass(oThis.chainId)
      ;

    const tokenTransfers = await tokenTransfersObject.select('id')
              .where(["block_number = ?", oThis.blockNumber]).fire();

    var data = {};
    data[oThis.blockNumber] = [];
    for(var i=0;i<tokenTransfers.length;i++){
      data[oThis.blockNumber].push(tokenTransfers[i].id);
    }
    return Promise.resolve(responseHelper.successWithData(data));

  }


};

Object.assign(BlockTokenTransferCacheKlass.prototype, BlockTokenTransferCacheKlassPrototype);

module.exports = BlockTokenTransferCacheKlass;