'use strict';
/**
 * Cache for getting the first page of top tokens
 *
 * @module lib/cacheManagement/TopTokensCache
 */
const rootPrefix = '../..',
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  BaseCache = require(rootPrefix + '/lib/cacheManagement/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  storageConstants = require(rootPrefix + '/lib/globalConstant/storage');

const InstanceComposer = OSTBase.InstanceComposer;

// Following require(s) for registering into instance composer
require(rootPrefix + '/app/services/home/GetTopTokens');

/**
 * Home page stats cache class
 *
 * @class
 */
class TopTokensCache extends BaseCache {
  /**
   * Constructor
   *
   * @augments BaseCache
   * @param {Object} params: cache key generation & expiry related params
   * @constructor
   */
  constructor() {
    super();

    const oThis = this;

    oThis.consistentBehavior = '1';
    oThis.useObject = true;

    // Call sub class method to set cache key using params provided
    oThis.setCacheKey();

    // Call sub class method to set cache expiry using params provided
    oThis.setCacheExpiry();

    // Call sub class method to set cache implementer using params provided
    oThis.setCacheImplementer();
  }

  /**
   * Set cache key
   *
   * @returns {String}
   */
  setCacheKey() {
    const oThis = this;

    oThis.cacheKey = oThis._cacheKeyPrefix() + oThis.ic().configStrategy.ddbTablePrefix + '_s_tt';

    return oThis.cacheKey;
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it
   *
   * @returns {Number}
   */
  setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = 300; // 5 mins

    return oThis.cacheExpiry;
  }

  /**
   * Set cache implementer in oThis.cacheImplementer and return it
   *
   * @returns {Object}
   */
  setCacheImplementer() {
    const oThis = this,
      cacheObject = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'cacheProvider').getInstance(storageConstants.shared);
    oThis.cacheImplementer = cacheObject.cacheInstance;

    return oThis.cacheImplementer;
  }

  /**
   * Fetch data from source
   *
   * @returns {Result}
   */
  async fetchDataFromSource() {
    const oThis = this,
      GetTopTokens = oThis.ic().getShadowedClassFor(coreConstants.icNameSpace, 'GetTopTokens'),
      response = await new GetTopTokens({}).perform();

    if (response.isFailure()) {
      return Promise.reject(responseHelper.error('l_cm_ttc_1', 'something_went_wrong'));
    }

    return responseHelper.successWithData(response.data);
  }
}

InstanceComposer.registerAsShadowableClass( TopTokensCache, coreConstants.icNameSpace, 'TopTokensCache');

module.exports = TopTokensCache;
