"use strict";

const rootPrefix = '../..'
  , baseCache = require(rootPrefix + '/lib/cache_management/base')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , AddressesModelKlass = require(rootPrefix + '/app/models/address')
  , BrandedTokenStatsModelKlass = require(rootPrefix + '/app/models/branded_token_stats')
;

/**
 * @constructor
 * @augments HomePageCacheKlass
 *
 * @param {Object} params - cache key generation & expiry related params
 *                 chain_id - Chain id
 *
 */
const HomePageCacheKlass = function(params) {

  const oThis = this;

  oThis.chainId = params['chain_id'];

  baseCache.call(this, params);

  oThis.useObject = true;

};

HomePageCacheKlass.prototype = Object.create(baseCache.prototype);

const HomePageCacheKlassPrototype = {

  /**
   * set cache key
   *
   * @return {String}
   */
  setCacheKey: function() {

    const oThis = this;

    oThis.cacheKey = oThis._cacheKeyPrefix() + "h_p"  ;

    return oThis.cacheKey;

  },

  /**
   * set cache expiry in oThis.cacheExpiry and return it
   *
   * @return {Number}
   */
  setCacheExpiry: function() {

    const oThis = this;

    oThis.cacheExpiry = 300; // 5 min ;

    return oThis.cacheExpiry;

  },
  /**
   * fetch data from source
   *
   * @return {Result}
   */
  fetchDataFromSource: async function() {

    const oThis = this
      , finalFormattedData = {}
    ;

    //get total COMMUNITIES

    const addressesModelObject = new AddressesModelKlass(oThis.chainId)
      , addresses = await addressesModelObject.select('COUNT(*) AS addressesCount').where(['address_type = ? ',1]).fire()
      , addressesCount = addresses[0].addressesCount
      , brandedTokenStatsModelObject = new BrandedTokenStatsModelKlass(oThis.chainId)
      , homeData = await brandedTokenStatsModelObject
        .select('SUM(market_cap) AS marketCap, SUM(token_transfers) AS tokenTransfers, SUM(token_ost_volume) AS tokenOstVolume, SUM(total_supply) AS totalMintedBts, COUNT(*) AS communitiesCount')
        .fire()
      , marketCap = homeData[0].marketCap
      , tokenTransfers = homeData[0].tokenTransfers
      , tokenOstVolume = homeData[0].tokenOstVolume
      , totalMintedBts = homeData[0].totalMintedBts // Can be a very big number
      , communitiesCount = homeData[0].communitiesCount
    ;

    finalFormattedData.communities_count = communitiesCount;
    finalFormattedData.holders_count = addressesCount;
    finalFormattedData.market_cap = marketCap;
    finalFormattedData.token_transfers = tokenTransfers;
    finalFormattedData.token_ost_volume = tokenOstVolume;
    finalFormattedData.total_minted_bts = totalMintedBts;

    return Promise.resolve(responseHelper.successWithData(finalFormattedData));
  }


};

Object.assign(HomePageCacheKlass.prototype, HomePageCacheKlassPrototype);

module.exports = HomePageCacheKlass;