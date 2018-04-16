"use strict";

const rootPrefix = '../..'
  , baseCache = require(rootPrefix + '/lib/cache_multi_management/base')
  , AddressDetailsModelKlass = require(rootPrefix + '/app/models/address_detail')
  , AddressHashModelKlass = require(rootPrefix + '/app/models/address')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * @constructor
 * @augments AddressDetailsCacheKlass
 *
 * @param {Object} params - cache key generation & expiry related params
 *
 */
const AddressDetailsCacheKlass = module.exports = function (params) {

  const oThis = this;

  oThis.addresses = params['addresses'];
  oThis.chainId = params['chain_id'];

  baseCache.call(this, params);

  oThis.useObject = true;

};

AddressDetailsCacheKlass.prototype = Object.create(baseCache.prototype);

AddressDetailsCacheKlass.prototype.constructor = AddressDetailsCacheKlass;

/**
 * set cache key
 *
 * @return {Object}
 */
AddressDetailsCacheKlass.prototype.setCacheKeys = function () {

  const oThis = this;

  oThis.cacheKeys = {};
  for (var i = 0; i < oThis.addresses.length; i++) {
    oThis.addresses[i] = oThis.addresses[i].toLowerCase();
    oThis.cacheKeys[oThis._cacheKeyPrefix() + "cmm_addr_" + oThis.addresses[i]] = oThis.addresses[i];
  }

  return oThis.cacheKeys;

};

/**
 * set cache expiry in oThis.cacheExpiry and return it
 *
 * @return {Number}
 */
AddressDetailsCacheKlass.prototype.setCacheExpiry = function () {

  const oThis = this;

  oThis.cacheExpiry = 300;// 5 minutes ;

  return oThis.cacheExpiry;

};

/**
 * fetch data from source
 *
 * @return {Result}
 */
AddressDetailsCacheKlass.prototype.fetchDataFromSource = async function (cacheAddressHahses) {

  if (!cacheAddressHahses) {
    return responseHelper.error(
      'cmm_ad_1', 'blank addresses'
    );
  }

  const oThis = this
    , addressHashObject = new AddressHashModelKlass(oThis.chainId)
    , addressDetailsObject = new AddressDetailsModelKlass(oThis.chainId)
  ;

  const addressHashData = await addressHashObject.select('id, address_hash').where(['address_hash IN (?)',cacheAddressHahses]).fire();

  if (addressHashData.length === 0){
    return responseHelper.error('cm_ad_2', 'address hash not found.');
  }


  const addressIdMap = {};
  for (var i=0; i<addressHashData.length; i++){
    const addressHash = addressHashData[i];

    addressIdMap[addressHash.id] = addressHash.address_hash;
  }

  const addressData = await addressDetailsObject.select('id, address_id, contract_address_id, tokens, total_token_transfers')
    .where(['address_id IN (?) and contract_address_id != 0', Object.keys(addressIdMap)]).fire()
  ;

  if(addressData.length  === 0){
    return responseHelper.error('cm_ad_3', 'address data not found.');
  }

  var formattedResponse = {};
  for (var i = 0; i < addressData.length; i++) {
    var rawResponse = addressData[i]
    ;

    rawResponse['address_hash'] = addressIdMap[rawResponse.address_id];
    formattedResponse[rawResponse.address_hash] = rawResponse;
  }


  return responseHelper.successWithData(formattedResponse);

};