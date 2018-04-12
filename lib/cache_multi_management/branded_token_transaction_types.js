"use strict";

const rootPrefix = '../..'
  , baseCache = require(rootPrefix + '/lib/cache_multi_management/base')
  , BrandedTokenTransactionTypesModelKlass = require(rootPrefix + '/app/models/branded_token_transaction_type')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * @constructor
 * @augments BrandedTokenTransactionTypesCacheKlass
 *
 * @param {Object} params - cache key generation & expiry related params
 *
 */
const BrandedTokenTransactionTypesCacheKlass = module.exports = function (params) {

  const oThis = this;

  oThis.ids = params['ids'];
  oThis.chainId = params['chain_id'];

  baseCache.call(this, params);

  oThis.useObject = true;

};

BrandedTokenTransactionTypesCacheKlass.prototype = Object.create(baseCache.prototype);

BrandedTokenTransactionTypesCacheKlass.prototype.constructor = BrandedTokenTransactionTypesCacheKlass;

/**
 * set cache key
 *
 * @return {Object}
 */
BrandedTokenTransactionTypesCacheKlass.prototype.setCacheKeys = function () {

  const oThis = this;

  oThis.cacheKeys = {};
  for (var i = 0; i < oThis.ids.length; i++) {
    oThis.cacheKeys[oThis._cacheKeyPrefix() + "cmm_bttx_t_" + oThis.ids[i]] = oThis.ids[i];
  }

  return oThis.cacheKeys;

};

/**
 * set cache expiry in oThis.cacheExpiry and return it
 *
 * @return {Number}
 */
BrandedTokenTransactionTypesCacheKlass.prototype.setCacheExpiry = function () {

  const oThis = this;

  oThis.cacheExpiry = 86400; // 24 hours ;

  return oThis.cacheExpiry;

};

/**
 * fetch data from source
 *
 * @return {Result}
 */
BrandedTokenTransactionTypesCacheKlass.prototype.fetchDataFromSource = async function (cacheIds) {

  const oThis = this;

  if (!cacheIds) {
    return responseHelper.error(
      'cmm_bttx_t_1', 'blank ids'
    );
  }

  const brandedTokenTransactionTypesObj = new BrandedTokenTransactionTypesModelKlass(oThis.chainId);
  const queryResponse = await brandedTokenTransactionTypesObj.select('id, contract_address_id, transaction_type').where(["id IN (?)", cacheIds]).fire();

  if (queryResponse.length === 0) {
    return responseHelper.error(
      'cmm_bttx_t_2', 'transaction type Data not found'
    );
  }

  var formattedResponse = {};
  for (var i = 0; i < queryResponse.length; i++) {
    var rawResponse = queryResponse[i];
    formattedResponse[rawResponse.id] = rawResponse;
  }

  return responseHelper.successWithData(formattedResponse);

};