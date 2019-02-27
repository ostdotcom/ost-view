'use strict';
/**
 * Cache management constants.
 *
 * @module lib/globalConstant/cacheManagement
 */
class CacheManagement {
  constructor() {}

  get memcached() {
    return 'memcached';
  }

  get inMemory() {
    return 'in_memory';
  }

  get redis() {
    return 'redis';
  }
}

module.exports = new CacheManagement();
