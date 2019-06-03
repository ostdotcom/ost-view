'use strict';
/**
 * Economy details cache
 *
 * @module lib/cacheMultiManagement/shared/Economy
 */
const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  BaseCache = require(rootPrefix + '/lib/cacheMultiManagement/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

const InstanceComposer = OSTBase.InstanceComposer;

// Following require(s) for registering into instance composer
require(rootPrefix + '/lib/models/BaseCurrency');

/**
 * Class for economy contract address cache
 *
 * @class
 */
class BaseCurrencyCache extends BaseCache {
  /**
   * Constructor for economy contract address cache
   *
   * @augments BaseCache
   *
   * @param {Object} params: cache key generation & expiry related params
   * @param {Array} params.baseCurrencyContractAddresses
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.baseCurrencyContractAddresses = params['baseCurrencyContractAddresses'];
    oThis.consistentBehavior = '1';
    oThis.useObject = true;
    oThis.cacheType = cacheManagementConst.inMemory;

    // Call sub class method to set cache key using params provided
    oThis.setCacheKeys();

    // Call sub class method to set cache expiry using params provided
    oThis.setCacheExpiry();

    // Call sub class method to set cache implementer using params provided
    oThis.setCacheImplementer();
  }

  /**
   * Set cache key
   *
   * @returns {{}}
   */
  setCacheKeys() {
    const oThis = this;

    for (let i = 0; i < oThis.baseCurrencyContractAddresses.length; i++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + 's_bc_' + oThis.baseCurrencyContractAddresses[i].toLowerCase()] =
        oThis.baseCurrencyContractAddresses[i];
    }

    oThis.invertedCacheKeys = basicHelper.invert(oThis.cacheKeys);

    return oThis.cacheKeys;
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it
   *
   * @returns {Number}
   */
  setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = 24 * 3600; // 24 hour

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source
   *
   * @param {Array} cacheMissBaseCurrencyContractAddresses
   *
   * @returns {response}
   */
  async fetchDataFromSource(cacheMissBaseCurrencyContractAddresses) {
    const oThis = this,
      BaseCurrencyModel = oThis.ic().getShadowedClassFor(coreConstants.icNameSpace, 'BaseCurrencyModel'),
      response = await new BaseCurrencyModel({
        consistentRead: oThis.consistentRead
      }).getData(cacheMissBaseCurrencyContractAddresses);

    return Promise.resolve(response);
  }
}

InstanceComposer.registerAsShadowableClass(BaseCurrencyCache, coreConstants.icNameSpace, 'BaseCurrencyCache');

module.exports = BaseCurrencyCache;
