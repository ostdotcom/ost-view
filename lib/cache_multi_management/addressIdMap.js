"use strict";

const rootPrefix = '../..'
  , baseCache = require(rootPrefix + '/lib/cache_multi_management/base')
  , AddressModelKlass = require(rootPrefix + '/app/models/address')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * @constructor
 *
 * @param {Object} params - cache key generation & expiry related params
 *
 */
const AddressIdMapCacheKlass = module.exports = function (params) {

  const oThis = this;

  oThis.addresses = params['addresses'];
  oThis.chainId = params['chain_id'];

  baseCache.call(this, params);

  oThis.useObject = true;

};

AddressIdMapCacheKlass.prototype = Object.create(baseCache.prototype);

AddressIdMapCacheKlass.prototype.constructor = AddressIdMapCacheKlass;

/**
 * set cache key
 *
 * @return {Object}
 */
AddressIdMapCacheKlass.prototype.setCacheKeys = function () {

  const oThis = this;

  oThis.cacheKeys = {};
  for (var i = 0; i < oThis.addresses.length; i++) {
    oThis.cacheKeys[oThis._cacheKeyPrefix() + "cmm_adIdm_" + oThis.addresses[i]] = oThis.addresses[i];
  }

  return oThis.cacheKeys;

};

/**
 * set cache expiry in oThis.cacheExpiry and return it
 *
 * @return {Number}
 */
AddressIdMapCacheKlass.prototype.setCacheExpiry = function () {

  const oThis = this;

  oThis.cacheExpiry = 86400;// 24 hours ;

  return oThis.cacheExpiry;

};

/**
 * fetch data from source
 *
 * @return {Result}
 */
AddressIdMapCacheKlass.prototype.fetchDataFromSource = async function (cacheAddressHahses) {

  const oThis = this;

  if (!cacheAddressHahses) {
    return responseHelper.error(
      'cmm_adIdMap_1', 'blank addresses'
    );
  }

  const addressObj = new AddressModelKlass(oThis.chainId);
  const queryResponse = await addressObj.select('id, address_hash, address_type').where(["address_hash IN (?)", cacheAddressHahses]).fire();

  if (queryResponse.length === 0) {
    return responseHelper.error(
      'cmm_adIdMap_2', 'Data not found for : '+cacheAddressHahses
    );
  }

  var formattedResponse = {};
  for (var i = 0; i < queryResponse.length; i++) {
    var rawResponse = queryResponse[i];
    formattedResponse[rawResponse.address_hash] = rawResponse;
  }

  return responseHelper.successWithData(formattedResponse);

};