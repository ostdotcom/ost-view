'use strict';
/**
 * Cache multi-management base
 *
 * @module lib/cacheMultiManagement/Base
 */
const rootPrefix = '../..',
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const InstanceComposer = OSTBase.InstanceComposer;

// Following require(s) for registering into instance composer
require(rootPrefix + '/lib/providers/cache');

/**
 * Class for cache multi-management base
 *
 * @class
 */
class BaseMultiCacheManagement {
  /**
   * Constructor for cache multi-management base
   *
   * @param {Object} params: cache key generation & expiry related params
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    if (!params) {
      params = {};
    }

    oThis.cacheKeys = {};

    oThis.invertedCacheKeys = {};

    oThis.cacheExpiry = null;

    oThis.cacheImplementer = null;
  }

  /**
   * Fetch data from cache, in case of cache miss calls sub class method to fetch data from source
   *
   * @returns {Promise<Result>}: On success, data.value has value. On failure, error details returned.
   */
  async fetch() {
    const oThis = this,
      batchSize = 50;

    let data = await oThis._fetchFromCache(),
      fetchDataRsp = null;

    // if there are any cache misses then fetch that data from source.
    while (data['cacheMiss'].length > 0) {
      let cacheMissData = data['cacheMiss'].splice(0, batchSize);
      fetchDataRsp = await oThis.fetchDataFromSource(cacheMissData);

      // if fetch from source failed do not set cache and return error response
      if (fetchDataRsp.isFailure()) {
        logger.notify('cmm_b_1', 'Something Went Wrong', fetchDataRsp);

        return fetchDataRsp;
      } else {
        // DO NOT WAIT for cache being set
        for (let i = 0; i < cacheMissData.length; i++) {
          let cacheMissFor = cacheMissData[i];
          let dataToSet =
            fetchDataRsp.data[cacheMissFor] || fetchDataRsp.data[cacheMissFor.toString().toLowerCase()] || {};
          data['cachedData'][cacheMissFor] = dataToSet;
          oThis._setCache(cacheMissFor, dataToSet);
        }
      }
    }

    return Promise.resolve(responseHelper.successWithData(data['cachedData']));
  }

  /**
   * Delete the cache entry
   *
   * @returns {Promise<*>}
   */
  async clear() {
    const oThis = this;

    for (let i = 0; i < Object.keys(oThis.cacheKeys).length; i++) {
      let cacheKey = Object.keys(oThis.cacheKeys)[i];
      oThis.cacheImplementer.del(cacheKey);
    }
  }

  // Methods which the sub-class would have to implement

  /**
   * Set cache key in oThis.cacheKey and return it
   *
   * @returns {String}
   */
  setCacheKeys() {
    throw 'sub class to implement setCacheKeys';
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it
   *
   * @returns {Number}
   */
  setCacheExpiry() {
    throw 'sub class to implement setCacheExpiry';
  }

  /**
   * Set cache implementer in oThis.cacheExpiry and return it
   *
   * @returns {Number}
   */
  setCacheImplementer() {
    throw 'sub class to implement setCacheImplementer';
  }

  /**
   * Fetch data from source.
   * NOTES: 1. return should be of klass Result
   *        2. data attr of return is returned and set in cache
   *
   * @param {Object|Array} data
   * @returns {Result}
   */
  async fetchDataFromSource(data) {
    throw 'sub class to implement fetchDataFromSource';
  }

  // Private methods start from here

  /**
   * Fetch from cache
   *
   * @returns {Object}
   */
  async _fetchFromCache() {
    const oThis = this;
    let cacheFetchResponse = null,
      cache_keys = Object.keys(oThis.cacheKeys),
      cache_miss = [],
      cachedResponse = {},
      process_cache_keys = [],
      batchSize = 500;

    while (cache_keys.length > 0) {
      process_cache_keys = cache_keys.splice(0, batchSize);
      cacheFetchResponse = await oThis.cacheImplementer.multiGet(process_cache_keys);

      if (cacheFetchResponse.isSuccess()) {
        let cachedData = cacheFetchResponse.data.response;
        for (let i = 0; i < process_cache_keys.length; i++) {
          let cacheKey = process_cache_keys[i];
          if (cachedData[cacheKey]) {
            cachedResponse[oThis.cacheKeys[cacheKey]] = JSON.parse(cachedData[cacheKey]);
          } else {
            cache_miss.push(oThis.cacheKeys[cacheKey]);
          }
        }
      } else {
        logger.error('==>Error while getting from cache: ', cacheFetchResponse);
        for (let i = 0; i < process_cache_keys.length; i++) {
          let cacheKey = process_cache_keys[i];
          cache_miss.push(oThis.cacheKeys[cacheKey]);
        }
      }
    }

    return { cacheMiss: cache_miss, cachedData: cachedResponse };
  }

  /**
   * Set data in cache.
   *
   * @param {String} key: key for cache data
   * @param {Object} dataToSet: data to set in cache
   * @returns {Result}
   */
  _setCache(key, dataToSet) {
    const oThis = this;

    let setCacheFunction = function(k, v) {
      let cacheKey = oThis.invertedCacheKeys[k.toString()];
      return oThis.cacheImplementer.set(cacheKey, JSON.stringify(v), oThis.cacheExpiry);
    };

    setCacheFunction(key, dataToSet).then(function(cacheSetResponse) {
      if (cacheSetResponse.isFailure()) {
        logger.notify('cmm_b_2', 'Something Went Wrong', cacheSetResponse);
      }
    });
  }

  /**
   * Cache key prefix
   *
   * @returns {String}
   */
  _cacheKeyPrefix() {
    return `ost_exp_mm_${coreConstants.VIEW_SUB_ENVIRONMENT}`;
  }
}

InstanceComposer.registerAsShadowableClass(
  BaseMultiCacheManagement,
  coreConstants.icNameSpace,
  'BaseMultiCacheManagement'
);

module.exports = BaseMultiCacheManagement;
