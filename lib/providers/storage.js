'use strict';
/**
 * OSTStorage Provider
 *
 * @module lib/providers/storage
 */
const OSTStorage = require('@ostdotcom/storage');

const rootPrefix = '../..',
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const InstanceComposer = OSTBase.InstanceComposer;

// Following require(s) for registering into instance composer
require(rootPrefix + '/lib/formatter/config');

/**
 * Class for storage provider
 *
 * @class
 */
class StorageProvider {
  /**
   * Constructor for storage provider
   *
   * @param {Object} configStrategy
   * @param instanceComposer
   */
  constructor(configStrategy, instanceComposer) {}

  /**
   * Get instance of OST Storage.
   *
   * @returns {Object}
   */
  getInstance() {
    const oThis = this;

    return OSTStorage.getInstance(oThis.getStorageConfigStrategy());
  }

  /**
   * Get storage config strategy
   *
   */
  getStorageConfigStrategy() {
    const oThis = this,
      explorerConfigStrategy = oThis.ic().configStrategy,
      configFormatter = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'configFormatter');

    if (!explorerConfigStrategy.storage) {
      throw 'missing db config for storage';
    }

    return Object.assign(
      {},
      configFormatter.formatStorageConfig(explorerConfigStrategy),
      configFormatter.formatCacheConfig(explorerConfigStrategy)
    );
  }
}

InstanceComposer.registerAsObject(StorageProvider, coreConstants.icNameSpace, 'storageProvider', true);

module.exports = StorageProvider;
