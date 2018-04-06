"use strict";

const rootPrefix = "../../.."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstants = require(rootPrefix+'/config/core_constants')
  , AddressIdMapCacheKlass = require(rootPrefix+'/lib/cache_multi_management/addressIdMap')
  , BrandedTokenModelKlass = require(rootPrefix+ '/app/models/branded_token')
  , AddressesCacheKlass = require(rootPrefix+'/lib/cache_multi_management/addresses')
;

/**
 * Get redirect url for an argument passes
 *
 * @param {object} params - this is object with keys.
 *                 q - value
 *                 chainId - Chain Id.
 *
 * @Constructor
 */
const GetSearchDetailsKlass = function(params){
  const oThis = this;
  oThis.argument = params.q;
  oThis.chainId = params.chainId;

  if (!oThis.chainId) {
    oThis.chainId = coreConstants.DEFAULT_CHAIN_ID;
  }
};

GetSearchDetailsKlass.prototype = {

  /**
   * Perform operation of getting route for passed argument
   *
   * @return {Promise<void>}
   */
  perform: async function () {
    const oThis = this;

      if (oThis.argument === undefined) {
        return Promise.resolve(responseHelper.error('s_s_sd_1','argument passes is undefined'));
      }

      if (oThis.argument.length === coreConstants.ACCOUNT_HASH_LENGTH) {

        const addressDetails = await new AddressIdMapCacheKlass({
            addresses: [oThis.argument],
            chain_id: oThis.chainId
          }).fetch()
          , addressData = addressDetails.data
        ;

        if (addressData[oThis.argument]){
          const addressType = addressData[oThis.argument]['address_type'];
          if (parseInt(addressType) === 3) {
            return Promise.resolve(responseHelper.successWithData("/tokendetails/" + oThis.argument));
          }
        }
        return Promise.resolve(responseHelper.successWithData("/address/" + oThis.argument));

      } else if (oThis.argument.length === coreConstants.TRANSACTION_HASH_LENGTH) {

        return Promise.resolve(responseHelper.successWithData("/transaction/" + oThis.argument));
      } else if (!isNaN(oThis.argument)) {

        return Promise.resolve(responseHelper.successWithData("/block/" + oThis.argument));
      } else {


        const brandedTokenObject = new BrandedTokenModelKlass(oThis.chainId)
          , brandedTokenData = await brandedTokenObject.select('contract_address_id').where(['name = ? or symbol = ? ',oThis.argument,oThis.argument]).fire()
        ;

        if (brandedTokenData.length === 0){
          return Promise.resolve(responseHelper.error('s_s_sd_2','branded token data not found'));
        }else{
          console.log("brandedTokenData : ",brandedTokenData);
          const contractAddressId =  brandedTokenData[0]['contract_address_id']
            , addresseDetails = await new AddressesCacheKlass({chain_id:oThis.chainId, ids:[contractAddressId]}).fetch()
            , addresseDetailsData = addresseDetails.data
          ;

          if (addresseDetails.isFailure() || !addresseDetailsData[contractAddressId]) {
            return Promise.resolve(responseHelper.error('s_s_sd_3','address details not found'));
          }

          const contractAddressData = addresseDetailsData[contractAddressId]
            , contractAddress = contractAddressData.address_hash
            , addressType = contractAddressData.address_type
          ;

          if (parseInt(addressType) === 3){
            return Promise.resolve(responseHelper.successWithData("/tokendetails/" + contractAddress));
          }else {
            return Promise.resolve(responseHelper.error('s_s_sd_4','contract address is not of type ERC20'));
          }

        }
      }
  }
};

module.exports = GetSearchDetailsKlass;