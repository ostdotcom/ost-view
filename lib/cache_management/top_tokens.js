"use strict";

const rootPrefix = '../..'
  , baseCache = require(rootPrefix + '/lib/cache_management/base')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , BrandedTokenModelKlass = require(rootPrefix + '/app/models/branded_token')
;

/**
 * @constructor
 * @augments TransactionCacheKlass
 *
 * @param {Object} params - cache key generation & expiry related params
 *                 chain_id - Chain id
 *
 */
const TopTokensCacheKlass = function(params) {

  const oThis = this;

  oThis.chainId = params.chain_id;

  baseCache.call(this, params);

  oThis.useObject = true;

};

TopTokensCacheKlass.prototype = Object.create(baseCache.prototype);

const TopTokensCacheKlassPrototype = {

  /**
   * set cache key
   *
   * @return {String}
   */
  setCacheKey: function () {

    const oThis = this;

    oThis.cacheKey = oThis._cacheKeyPrefix() + "topTokens";

    return oThis.cacheKey;

  },

  /**
   * set cache expiry in oThis.cacheExpiry and return it
   *
   * @return {Number}
   */
  setCacheExpiry: function () {

    const oThis = this;

    oThis.cacheExpiry = 300; // 24 hours ;

    return oThis.cacheExpiry;

  },

  /**
   * fetch data from source
   *
   * @return {Result}
   */
  fetchDataFromSource: async function() {

    const oThis = this
      , brandedTokenObject = new BrandedTokenModelKlass(oThis.chainId)
    ;

    const topTokens = await brandedTokenObject.select('contract_address_id')
      .order_by('id desc')
      .fire();
    var data = {};
    data['topTokens'] = [];
    for(var i=0;i<topTokens.length;i++){
      data['topTokens'].push(topTokens[i].contract_address_id);
    }
    return Promise.resolve(responseHelper.successWithData(data));
  }
}

Object.assign(TopTokensCacheKlass.prototype, TopTokensCacheKlassPrototype);

module.exports = TopTokensCacheKlass;