'use strict';
/**
 * Shared cache instance provider which is not chain specific.
 *
 * @module lib/providers/cache
 */
const rootPrefix = '../..',
  OpenStCache = require('@openstfoundation/openst-cache'),
  OSTBase = require('@openstfoundation/openst-base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  storageConstants = require(rootPrefix + '/lib/globalConstant/storage');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/formatter/config');
/**
 * Class for cache provider
 *
 * @class
 */
class CacheProvider {
  constructor(configStrategy, instanceComposer) {}

  /**
   * Get instance of openst-cache.
   *
   * @param {String} cacheType
   * @param {Number} chainId
   * @returns {Object}
   */
  getInstance(cacheType, chainId) {
    const oThis = this;
    return OpenStCache.getInstance(oThis.getCacheConfigStrategy(cacheType, chainId));
  }

  /**
   * Get cache config strategy
   *
   * @param {String} cacheType: shared or sharded
   * @param {Number} chainId
   * @returns {{} & Object}
   */
  getCacheConfigStrategy(cacheType, chainId) {
    const oThis = this,
      blockScannerConfigStrategy = oThis.ic().configStrategy,
      configFormatter = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'configFormatter');

    switch (cacheType) {
      case storageConstants.shared:
        if (!blockScannerConfigStrategy.cache) {
          throw `missing db config for ${cacheType}`;
        }

        return Object.assign({}, configFormatter.formatCacheConfig(blockScannerConfigStrategy));

      case storageConstants.sharded:
        let chainConfig = configFormatter.configFor(chainId);
        if (!chainConfig) {
          throw `missing db config for ${cacheType} - ${chainId} pair`;
        }
        return Object.assign({}, configFormatter.formatCacheConfig(chainConfig));
      default:
        throw `unsupported ${cacheType}`;
    }
  }
}

InstanceComposer.registerAsObject(CacheProvider, coreConstants.icNameSpace, 'cacheProvider', true);
