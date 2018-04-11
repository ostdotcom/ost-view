"use strict";

const rootPrefix = '../..'
  , baseCache = require(rootPrefix + '/lib/cache_multi_management/base')
  , BrandedTokenModelKlass = require(rootPrefix + '/app/models/branded_token')
  , AddressesCacheKlass = require(rootPrefix + '/lib/cache_multi_management/addresses')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * @constructor
 * @augments BrandedTokensCacheKlass
 *
 * @param {Object} params - cache key generation & expiry related params
 *                contract_address_ids - list of contract addresses
 *                chain_id - chain id
 */
const BrandedTokensCacheKlass = module.exports = function (params) {

  const oThis = this;

  oThis.contractAddressIds = params['contract_address_ids'];
  oThis.chainId = params['chain_id'];

  baseCache.call(this, params);

  oThis.useObject = true;

};

BrandedTokensCacheKlass.prototype = Object.create(baseCache.prototype);

BrandedTokensCacheKlass.prototype.constructor = BrandedTokensCacheKlass;

/**
 * set cache key
 *
 * @return {Object}
 */
BrandedTokensCacheKlass.prototype.setCacheKeys = function () {

  const oThis = this;

  oThis.cacheKeys = {};
  for (var i = 0; i < oThis.contractAddressIds.length; i++) {
    oThis.cacheKeys[oThis._cacheKeyPrefix() + "cmm_bt_" + oThis.contractAddressIds[i]] = oThis.contractAddressIds[i];
  }

  return oThis.cacheKeys;

};

/**
 * set cache expiry in oThis.cacheExpiry and return it
 *
 * @return {Number}
 */
BrandedTokensCacheKlass.prototype.setCacheExpiry = function () {

  const oThis = this;

  oThis.cacheExpiry = 86400 // 24 hours ;

  return oThis.cacheExpiry;

};

/**
 * fetch data from source
 *
 * @return {Result}
 */
BrandedTokensCacheKlass.prototype.fetchDataFromSource = async function (cacheIds) {

  const oThis = this;


  if (!cacheIds) {
    return responseHelper.error(
      'cmm_bt_1', 'blank ids'
    );
  }

  const brandedTokenObj = new BrandedTokenModelKlass(oThis.chainId);
  const queryResponse = await brandedTokenObj.select('*').where(["contract_address_id IN (?)", cacheIds]).fire();

  if (queryResponse.length === 0) {
    return responseHelper.error(
      'cmm_bt_2', 'No Data found'
    );
  }

  var addressIds = [];

  for (var i = 0; i < queryResponse.length; i++) {
    var rawResponse = queryResponse[i];
    addressIds.push(rawResponse.contract_address_id);
  }

  const addressData = await new AddressesCacheKlass({chain_id: oThis.chainId, ids: addressIds}).fetch();
  if(addressData.isFailure() || !addressData.data){
    return responseHelper.error('cmm_bt_3', 'No Data found');
  }
  const addresses = addressData.data;

  var formattedResponse = {};
  for (var i = 0; i < queryResponse.length; i++) {
    var rawResponse = queryResponse[i];
    formattedResponse[rawResponse.contract_address_id] = {
      id: rawResponse.id,
      company_name: rawResponse.name,
      contract_address_id: rawResponse.contract_address_id,
      contract_address: addresses[rawResponse.contract_address_id].address_hash,
      company_symbol: rawResponse.symbol,
      conversion_rate: rawResponse.conversion_rate,
      symbol_icon: rawResponse.symbol_icon,
      creation_timestamp: rawResponse.creation_timestamp,
      uuid: rawResponse.uuid
    }
  }

  return responseHelper.successWithData(formattedResponse);

};