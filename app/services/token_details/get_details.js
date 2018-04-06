"use strict";

const rootPrefix = "../../.."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , BrandedTokenCacheKlass = require(rootPrefix + '/lib/cache_multi_management/branded_tokens')
  , AddressesCacheKlass = require(rootPrefix+'/lib/cache_multi_management/addressIdMap')
  , coreConstants = require(rootPrefix + '/config/core_constants')
;

/**
 * Get details of a branded token
 *
 * @param {object} params - this is object with keys.
 *                 chainId - Chain Id.
 *                 contractAddress - contract address of branded token
 *
 * @Constructor
 */
const GetBrandedTokenDetailsKlass = function(params){
  const oThis = this;

  oThis.chainId = params.chainId;
  oThis.contractAddress = params.contractAddress

  if (!oThis.chainId) {
    oThis.chainId = coreConstants.DEFAULT_CHAIN_ID;
  }
};

GetBrandedTokenDetailsKlass.prototype = {

  /**
   * Perform operation of getting branded token details
   *
   * @return {Promise<void>}
   */
  perform: async function(){
    const oThis = this
      , finalFormattedHomeData = {}
    ;

    const addressDetails = await new AddressesCacheKlass({chain_id: oThis.chainId, addresses: [oThis.contractAddress]}).fetch()
      , addressDetailsData = addressDetails.data
    ;

    if(addressDetails.isSuccess() && addressDetailsData[oThis.contractAddress]){
      const addressInfo = addressDetailsData[oThis.contractAddress]
      ;

      const contaractAddressId = addressInfo.id
        , brandedTokenDetails = await new BrandedTokenCacheKlass({chain_id: oThis.chainId, contract_address_ids: [contaractAddressId]}).fetch()
        , brandedTokenDetailsData = brandedTokenDetails.data
      ;

      if (brandedTokenDetails.isSuccess() || brandedTokenDetailsData[contaractAddressId]){
        const tokenDetails = brandedTokenDetailsData[contaractAddressId];

        finalFormattedHomeData['token_details'] = tokenDetails;
      }
    }

    finalFormattedHomeData['token_info'] = oThis.getTokenDetails();
    finalFormattedHomeData['token_stats'] = oThis.getTokenStats();

    console.log("finalFormattedHomeData : ",finalFormattedHomeData);


    return Promise.resolve(responseHelper.successWithData(finalFormattedHomeData));
  }

  , getTokenDetails: function (token_details) {

    const oThis = this;

    var marketCapValue = 0
      , totalSupplyValue = 0
      , tokenHoldersValue = 0
    ;

    if (token_details && token_details.market_cap){
      marketCapValue = TokenUnits.convertToNormal(token_details['market_cap']).toFormat(0);
    }

    if (token_details && token_details.token_holders){
      tokenHoldersValue = TokenUnits.toBigNumber(token_details['token_holders']).toFormat(0);
    }

    if (token_details && token_details.total_supply){
      totalSupplyValue = TokenUnits.convertToNormal(token_details['total_supply']).toFormat(0)
    }
    var details = [
      {
        img:"market-cap",
        title:"Market Cap",
        value: marketCapValue,
        is_badge_visible:true
      },
      {
        img:"token-holders",
        title:"Token Holders",
        value: tokenHoldersValue,
        is_badge_visible:false
      },
      {
        img:"total-supply",
        title:"Total Supply",
        value: totalSupplyValue,
        is_badge_visible:false
      }
    ];

    return details;
  },

  getTokenStats: function (token_details) {
    const oThis = this;

    var tokentransfersValue = 0
      , tokenVolumeValue = 0
    ;

    if (token_details && token_details.token_transfers){
      tokentransfersValue = TokenUnits.toBigNumber(token_details.token_transfers).toFormat(0).toString(10);
    }

    if (token_details && token_details.token_volume){
      tokenVolumeValue = TokenUnits.convertToNormal(token_details.token_volume).toFormat(0).toString(10)
    }

    var details = {
      token_transfers: tokentransfersValue,
      token_volume: tokenVolumeValue
    };

    return details;
  }
};

module.exports = GetBrandedTokenDetailsKlass;