'use strict';
/**
 * Storage constants
 *
 * @module lib/globalConstant/storage
 */
class StorageConstants {
  constructor() {}

  get shared() {
    return 'shared';
  }

  get sharded() {
    return 'sharded';
  }
}

module.exports = new StorageConstants();
