'use strict';
/**
 * This file has the error config for certain code validations.
 *
 * @module config/error/param
 */

const paramErrorConfig = {
  missingChainId: {
    parameter: 'chainId',
    code: 'missing',
    message: 'Missing chain id'
  },
  invalidShardName: {
    parameter: 'invalidShardName',
    code: 'invalid',
    message: 'Invalid shard name'
  },
  missingTransactionHashes: {
    parameter: 'transactionHashes',
    code: 'missing',
    message: 'Missing transaction hashes'
  }
};

module.exports = paramErrorConfig;
