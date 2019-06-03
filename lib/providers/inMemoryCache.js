'use strict';

/**
 * In-memory cache instance provider.
 *
 * @module /lib/providers/inMemoryCache
 */

const rootPrefix = '../..',
  OSTCache = require('@ostdotcom/cache');

/**
 * Constructor
 *
 * @constructor
 */
const InMemoryCacheProviderKlass = function() {};

InMemoryCacheProviderKlass.prototype = {
  /**
   * Get provider
   *
   * @return {Object}
   */
  getInstance: function(cacheConsistentBehavior) {
    const cacheConfigStrategy = {
      cache: {
        engine: 'none',
        namespace: `ostView_${cacheConsistentBehavior}`,
        defaultTtl: 36000,
        consistentBehavior: cacheConsistentBehavior
      }
    };

    return OSTCache.getInstance(cacheConfigStrategy);
  }
};

module.exports = new InMemoryCacheProviderKlass();
