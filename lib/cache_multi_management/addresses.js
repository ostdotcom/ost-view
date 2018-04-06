"use strict";

const rootPrefix = '../..'
  , baseCache = require(rootPrefix + '/lib/cache_multi_management/base')
  , AddressModelKlass = require(rootPrefix + '/app/models/address')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * @constructor
 * @augments AddressesCacheKlass
 *
 * @param {Object} params - cache key generation & expiry related params
 *
 */
const AddressesCacheKlass = module.exports = function (params) {

  const oThis = this;
  oThis.ids = params['ids'];
  oThis.chainId = params['chain_id'];

  baseCache.call(this, params);

  oThis.useObject = true;

};

AddressesCacheKlass.prototype = Object.create(baseCache.prototype);

AddressesCacheKlass.prototype.constructor = AddressesCacheKlass;

/**
 * set cache key
 *
 * @return {Object}
 */
AddressesCacheKlass.prototype.setCacheKeys = function () {

  const oThis = this;

  oThis.cacheKeys = {};
  for (var i = 0; i < oThis.ids.length; i++) {
    oThis.cacheKeys[oThis._cacheKeyPrefix() + "cmm_adr_" + oThis.ids[i]] = oThis.ids[i];
  }

  return oThis.cacheKeys;

};

/**
 * set cache expiry in oThis.cacheExpiry and return it
 *
 * @return {Number}
 */
AddressesCacheKlass.prototype.setCacheExpiry = function () {

  const oThis = this;

  oThis.cacheExpiry = 86400; // 24 hours ;

  return oThis.cacheExpiry;

};

/**
 * fetch data from source
 *
 * @return {Result}
 */
AddressesCacheKlass.prototype.fetchDataFromSource = async function (cacheIds) {

  const oThis = this;

  if (!cacheIds) {
    return responseHelper.error(
      'cmm_ad_1', 'blank ids'
    );
  }

  const addressObj = new AddressModelKlass(oThis.chainId);
  const queryResponse = await addressObj.select('id, address_hash, address_type').where(["id IN (?)", cacheIds]).fire();

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