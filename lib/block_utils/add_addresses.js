"use strict";

/**
 * Insert addreses after looking in cache
 *
 * @module /lib/block_utils/add_addresses
 *
 */
const rootPrefix = "../.."
  , AddressIdCacheKlass = require(rootPrefix + '/lib/cache_multi_management/addressIdMap')
  , AddressKlass = require(rootPrefix + "/app/models/address")
  , addressConst = require(rootPrefix + '/lib/global_constant/address')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  ;

/**
 * Insert addreses after looking in cache
 *
 * @param {object} params - this is object with keys.
 *                 addresses_hash - Addresses hash to fetch data for or insert.
 *                 chain_id - Chain Id.
 * @constructor
 */
const AddAddressesKlass = function(params){
  const oThis = this;

  oThis.addressesHash = params.addresses_hash;
  oThis.chainId = params.chain_id;
};

AddAddressesKlass.prototype = {

  perform: async function(){
    const oThis = this;

    if(Object.keys(oThis.addressesHash).length <= 0){
      return Promise.resolve(responseHelper.successWithData({}));
    }

    let addressCached = await new AddressIdCacheKlass({addresses: Object.keys(oThis.addressesHash), chain_id: oThis.chainId}).fetch()
      , cachedAddressData = {}
      , dataToInsert = []
      , flushCache = []
      ;

    if(addressCached.isSuccess()){
      cachedAddressData = addressCached.data;
    }

    let addressObj = new AddressKlass(oThis.chainId);

    const ADDR_USER_TYPE = addressObj.invertedAddressTypes[addressConst.userAddress];

    // If data is not found in db then insert or address type has been changed from user to contract then re-insert
    for(let key in oThis.addressesHash){
      let addrType = oThis.addressesHash[key].address_type;
      if(!cachedAddressData[key] || (cachedAddressData[key].address_type == ADDR_USER_TYPE &&  addrType != ADDR_USER_TYPE)){
        dataToInsert.push([key, addrType]);
        flushCache.push(key);
      }
    }

    if(dataToInsert.length > 0){
      await addressObj.insertMultiple(AddressKlass.DATA_SEQUENCE_ARRAY, dataToInsert)
        .onDuplicate('address_type = IF(VALUES(address_type)!=' + addressObj.invertedAddressTypes[addressConst.userAddress] + ', VALUES(address_type) , address_type)').fire();
      new AddressIdCacheKlass({addresses: flushCache, chain_id: oThis.chainId}).clear();
      addressCached = await new AddressIdCacheKlass({addresses: Object.keys(oThis.addressesHash), chain_id: oThis.chainId}).fetch();
      cachedAddressData = addressCached.data;
    }

    return Promise.resolve(responseHelper.successWithData(cachedAddressData));
  }
};

module.exports = AddAddressesKlass;