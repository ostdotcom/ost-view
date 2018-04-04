"use strict";

const rootPrefix = '../..'
  , baseCache = require(rootPrefix + '/lib/cache_multi_management/base')
  , TokenTransferModelKlass = require(rootPrefix + '/app/models/token_transfer')
  , AddressesCacheKlass = require(rootPrefix + '/lib/cache_multi_management/addresses')
  , TransactionHashCacheKlass = require(rootPrefix + '/lib/cache_multi_management/transaction_hashes')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * @constructor
 * @augments TokenTransfersCacheKlass
 *
 * @param {Object} params - cache key generation & expiry related params
 *
 */
const TokenTransfersCacheKlass = module.exports = function (params) {

  const oThis = this;

  oThis.ids = params['ids'];
  oThis.chainId = params['chain_id'];

  baseCache.call(this, params);

  oThis.useObject = true;

};

TokenTransfersCacheKlass.prototype = Object.create(baseCache.prototype);

TokenTransfersCacheKlass.prototype.constructor = TokenTransfersCacheKlass;

/**
 * set cache key
 *
 * @return {Object}
 */
TokenTransfersCacheKlass.prototype.setCacheKeys = function () {

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
TokenTransfersCacheKlass.prototype.setCacheExpiry = function () {

  const oThis = this;

  oThis.cacheExpiry = 86400 // 24 hours ;

  return oThis.cacheExpiry;

};

/**
 * fetch data from source
 *
 * @return {Result}
 */
TokenTransfersCacheKlass.prototype.fetchDataFromSource = async function (cacheIds) {

  const oThis = this;

  if (!cacheIds) {
    return responseHelper.error(
      'cmm_tt_1', 'blank ids'
    );
  }

  const tokenTransferObj = new TokenTransferModelKlass(oThis.chainId);
  const queryResponse = await tokenTransferObj.select('*').where(["id IN (?)", cacheIds]).fire();

  if (queryResponse.length === 0) {
    return responseHelper.error(
      'cmm_tt_2', 'No Data found'
    );
  }

  var addressIds = []
    , transactionIds = [];

  for (var i = 0; i < queryResponse.length; i++) {
    var rawResponse = queryResponse[i];
    addressIds.push(rawResponse.contract_address_id, rawResponse.from_address_id, rawResponse.to_address_id);
    transactionIds.push(rawResponse.transaction_hash_id);
  }

  const addressData = await new AddressesCacheKlass({chain_id: oThis.chainId, ids: addressIds}).fetch();
  if(addressData.isFailure() || !addressData.data){
    return responseHelper.error('cmm_tt_3', 'No Data found');
  }
  const addresses = addressData.data;

  const transactionHashData = await new TransactionHashCacheKlass({chain_id: oThis.chainId, ids: transactionIds}).fetch();
  if(transactionHashData.isFailure() || !transactionHashData.data){
    return responseHelper.error('cmm_tt_4', 'No Data found');
  }
  const transactionHashes = transactionHashData.data;

  var formattedResponse = {};
  for (var i = 0; i < queryResponse.length; i++) {
    var rawResponse = queryResponse[i];
    formattedResponse[rawResponse.id] = {
      id: rawResponse.id,
      contract_id: rawResponse.contract_address_id,
      contract_address: addresses[rawResponse.contract_address_id].address_hash,
      t_from: addresses[rawResponse.from_address_id].address_hash,
      t_to: addresses[rawResponse.to_address_id].address_hash,
      tokens: rawResponse.tokens,
      timestamp: rawResponse.block_timestamp,
      block_number: rawResponse.block_number,
      transaction_hash: transactionHashes[rawResponse.transaction_hash_id].transaction_hash
    }
  }

  return responseHelper.successWithData(formattedResponse);

};