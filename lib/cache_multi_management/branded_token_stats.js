"use strict";

const rootPrefix = '../..'
  , baseCache = require(rootPrefix + '/lib/cache_multi_management/base')
  , BrandedTokenStatsModelKlass = require(rootPrefix + '/app/models/branded_token_stats')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , AddressDetailsModelKlass = require(rootPrefix+ '/app/models/address_detail')
;

/**
 * @constructor
 * @augments BrandedTokenStatsCacheKlass
 *
 * @param {Object} params - cache key generation & expiry related params
 *                contract_address_ids - list of contract address ids
 *                chain_id - chain id
 */
const BrandedTokenStatsCacheKlass = module.exports = function (params) {

  const oThis = this;

  oThis.contractAddressIds = params['contract_address_ids'];
  oThis.chainId = params['chain_id'];

  baseCache.call(this, params);

  oThis.useObject = true;

};

BrandedTokenStatsCacheKlass.prototype = Object.create(baseCache.prototype);

BrandedTokenStatsCacheKlass.prototype.constructor = BrandedTokenStatsCacheKlass;

/**
 * set cache key
 *
 * @return {Object}
 */
BrandedTokenStatsCacheKlass.prototype.setCacheKeys = function () {

  const oThis = this;

  oThis.cacheKeys = {};
  for (var i = 0; i < oThis.contractAddressIds.length; i++) {
    oThis.cacheKeys[oThis._cacheKeyPrefix() + "cmm_bt_st_" + oThis.contractAddressIds[i]] = oThis.contractAddressIds[i];
  }

  return oThis.cacheKeys;

};

/**
 * set cache expiry in oThis.cacheExpiry and return it
 *
 * @return {Number}
 */
BrandedTokenStatsCacheKlass.prototype.setCacheExpiry = function () {

  const oThis = this;

  oThis.cacheExpiry = 3600;// 5 mins ;

  return oThis.cacheExpiry;

};

/**
 * fetch data from source
 *
 * @return {Result}
 */
BrandedTokenStatsCacheKlass.prototype.fetchDataFromSource = async function (cacheIds) {

  const oThis = this;


  if (!cacheIds) {
    return responseHelper.error(
      'cmm_bt_s_1', 'blank ids'
    );
  }

  const brandedTokenStatsObj = new BrandedTokenStatsModelKlass(oThis.chainId);
  const queryResponse = await brandedTokenStatsObj.select('*').where(["contract_address_id IN (?)", cacheIds]).fire()
    , addressDetails = await new AddressDetailsModelKlass(oThis.chainId).selectTotalTokenDetails(cacheIds);
  ;

  if (queryResponse.length === 0) {
    return responseHelper.error(
      'cmm_bt_s_2', 'No Data found'
    );
  }


  var formattedResponse = {};
  for (var i = 0; i < queryResponse.length; i++) {
    var rawResponse = queryResponse[i]
      , tc = addressDetails[rawResponse.contract_address_id] || {};
    ;

    rawResponse.token_holders = tc.total_users || 0;
    formattedResponse[rawResponse.contract_address_id] = rawResponse;
  }

  return responseHelper.successWithData(formattedResponse);

};