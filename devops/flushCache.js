'use strict';

/* Cache flush utility for explorer
 *
 * Example: node devops/flush_cache.js 'shared' 1000
 */

const rootPrefix = '..',
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  configStrategy = require(rootPrefix + '/configuration');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/providers/cache');

let cacheType = process.argv[2],
  chainId = process.argv[3];

class CacheFlush {
  /**
   * constructor
   */
  constructor() {}

  /**
   * perform
   *
   * @return {Promise<*|Promise<result>>}
   */
  async perform() {
    if (cacheType == 'sharded' && !chainId) {
      return Promise.reject('==== chainId is mandatory for sharded cache!!! ====');
    }

    let instanceComposer = new InstanceComposer(configStrategy),
      cache = instanceComposer.getInstanceFor(coreConstants.icNameSpace, 'cacheProvider'),
      cacheImplementer = cache.getInstance(cacheType, chainId).cacheInstance;

    return cacheImplementer.delAll();
  }
}

let cacheflush = new CacheFlush();

cacheflush
  .perform()
  .then(function(r) {
    console.log('====Flushed', cacheType, 'memcached ====');
    process.exit(0);
  })
  .catch(function(err) {
    console.log('====Error ====\n', err);
    process.exit(1);
  });
