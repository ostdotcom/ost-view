"use strict";

const rootPrefix = "../../.."
  , AddressDetailsCacheKlass = require(rootPrefix + '/lib/cache_multi_management/address_details')
  , BrandedTokenCacheKlass = require(rootPrefix + '/lib/cache_multi_management/branded_tokens')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * Get Details of an address
 *
 * @param {object} params - this is object with keys.
 *                 address - address to fetch data for.
 *                 chainId - Chain Id.
 *
 * @Constructor
 */
const GetAddressDetailsKlass = function(params){
  const oThis = this;

  oThis.address = params.address.toLowerCase();
  oThis.chainId = params.chainId;

};

GetAddressDetailsKlass.prototype = {

  /**
   * Perform operation of getting block details
   *
   * @return {Promise<void>}
   */
  perform: async function(){
    const oThis = this
      , finalAddressDetails = {}
    ;

    const addressDetails = await new AddressDetailsCacheKlass({chain_id: oThis.chainId, addresses: [oThis.address]}).fetch()
      , addressDetailsData = addressDetails.data
    ;
    
    if(addressDetails.isFailure() || !addressDetailsData[oThis.address]){
      return Promise.resolve(responseHelper.successWithData());
    }

    const addressInfo = addressDetailsData[oThis.address]
    ;

    finalAddressDetails['address_details'] = addressInfo;
    const brandedTokenDetails = await new BrandedTokenCacheKlass({chain_id: oThis.chainId, contract_address_ids: [addressInfo.contract_address_id]}).fetch();

    if (brandedTokenDetails.isSuccess()){
      finalAddressDetails['contract_addresses'] = brandedTokenDetails.data;
    }

    return Promise.resolve(responseHelper.successWithData(finalAddressDetails));
  }
};

module.exports = GetAddressDetailsKlass;