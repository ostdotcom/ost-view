"use strict";

const rootPrefix = '../..'
  , baseCache = require(rootPrefix + '/lib/cache_multi_management/base')
  , TransactionHashModelKlass = require(rootPrefix + '/app/models/transaction_hash')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * @constructor
 * @augments TransactionHashCacheKlass
 *
 * @param {Object} params - cache key generation & expiry related params
 *
 */
const TransactionHashCacheKlass = module.exports = function (params) {

  const oThis = this;

  oThis.ids = params['ids'];
  oThis.chainId = params['chain_id'];

  baseCache.call(this, params);

  oThis.useObject = true;

};

TransactionHashCacheKlass.prototype = Object.create(baseCache.prototype);

TransactionHashCacheKlass.prototype.constructor = TransactionHashCacheKlass;

/**
 * set cache key
 *
 * @return {Object}
 */
TransactionHashCacheKlass.prototype.setCacheKeys = function () {

  const oThis = this;

  oThis.cacheKeys = {};
  for (var i = 0; i < oThis.ids.length; i++) {
    oThis.cacheKeys[oThis._cacheKeyPrefix() + "cmm_trh_" + oThis.ids[i]] = oThis.ids[i];
  }

  return oThis.cacheKeys;

};

/**
 * set cache expiry in oThis.cacheExpiry and return it
 *
 * @return {Number}
 */
TransactionHashCacheKlass.prototype.setCacheExpiry = function () {

  const oThis = this;

  oThis.cacheExpiry = 86400 // 24 hours ;

  return oThis.cacheExpiry;

};

/**
 * fetch data from source
 *
 * @return {Result}
 */
TransactionHashCacheKlass.prototype.fetchDataFromSource = async function (cacheIds) {

  const oThis = this;

  if (!cacheIds) {
    return responseHelper.error(
      'cmm_ad_1', 'blank ids'
    );
  }

  const transactionHashObj = new TransactionHashModelKlass(oThis.chainId);
  const queryResponse = await transactionHashObj.select('id, transaction_hash, branded_token_transaction_type_id').where(["id IN (?)", cacheIds]).fire();

  if (queryResponse.length === 0) {
    return responseHelper.error(
      'cmm_ad_2', 'No Data found'
    );
  }

  var formattedResponse = {};
  for (var i = 0; i < queryResponse.length; i++) {
    var rawResponse = queryResponse[i];
    formattedResponse[rawResponse.id] = rawResponse;
  }

  return responseHelper.successWithData(formattedResponse);

};