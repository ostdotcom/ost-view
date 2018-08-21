"use strict";

const rootPrefix = "../../.."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , BrandedTokenCacheKlass = require(rootPrefix + '/lib/cache_multi_management/branded_tokens')
  , AddressIdMapCacheKlass = require(rootPrefix+'/lib/cache_multi_management/addressIdMap')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , BrandedTokenStatsDetails = require (rootPrefix + '/lib/cache_multi_management/branded_token_stats')
  , TokenUnits = require(rootPrefix + '/helpers/tokenUnits')
  , basicHelper = require(rootPrefix + '/helpers/base')
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
  oThis.contractAddress = params.contractAddress.toLowerCase();

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

    const addressIdMap = await new AddressIdMapCacheKlass({chain_id: oThis.chainId, addresses: [oThis.contractAddress]}).fetch()
      , addressIdMapData = addressIdMap.data
    ;

    console.log("addressIdMapData : ",addressIdMapData , "addressIdMap : ",addressIdMap);

    if(addressIdMap.isFailure() || !addressIdMapData[oThis.contractAddress]){
      return Promise.resolve(responseHelper.error('s_td_gd_1', 'address id map data not found for :'+oThis.contractAddress));
    }

    const addressInfo = addressIdMapData[oThis.contractAddress]
    ;

    const contaractAddressId = addressInfo.id
      , brandedTokenDetails = await new BrandedTokenCacheKlass({chain_id: oThis.chainId, contract_address_ids: [contaractAddressId]}).fetch()
      , brandedTokenDetailsData = brandedTokenDetails.data
      , brandedTokenStats = await new BrandedTokenStatsDetails({chain_id: oThis.chainId,contract_address_ids : [contaractAddressId]}).fetch()
      , brandedTokenStatsData = brandedTokenStats.data
      , brandedTokenStatsDetails = brandedTokenStatsData[contaractAddressId]
    ;

    if (brandedTokenDetails.isFailure() || !brandedTokenDetailsData[contaractAddressId]){
      return Promise.resolve(responseHelper.error('s_td_gd_2', 'branded token data not found for :'+contaractAddressId));
    }

    const tokenDetails = brandedTokenDetailsData[contaractAddressId];

    finalFormattedHomeData['token_details'] = tokenDetails;
    finalFormattedHomeData['token_info'] = oThis.getTokenDetails(brandedTokenStatsDetails, tokenDetails.conversion_rate);
    finalFormattedHomeData['token_stats'] = oThis.getTokenStats(brandedTokenStatsDetails);

    return Promise.resolve(responseHelper.successWithData(finalFormattedHomeData));
  }

  , getTokenDetails: function (token_details, conversion_rate) {

    const oThis = this;

    var marketCapValue = 0
      , totalSupplyValue = 0
      , tokenHoldersValue = 0
    ;

    if (token_details && token_details.market_cap){
      marketCapValue = TokenUnits.convertToNormal(token_details['market_cap']).toFormat(0).toString(10);
    }

    if (token_details && token_details.token_holders){
      tokenHoldersValue = TokenUnits.toBigNumber(token_details['token_holders']).toFormat(0).toString(10);
    }

    if (token_details && token_details.total_supply){
      totalSupplyValue = TokenUnits.convertToNormal(token_details['total_supply']).toFormat(0).toString(10)
    }


    let images = [];
    let titles = [];
    let values = [];
    let visibility = [];

    let details = [];

    if (!basicHelper.isMainSubEnvironment()) {
      images = ["market-cap", "token-holders", "total-supply"];
      titles = ["Market Cap", "Token Holders", "Total Supply"];
      values = [marketCapValue, tokenHoldersValue, totalSupplyValue];
      visibility = [true, false, false];
    } else {
      images = ["market-cap", "token-holders", "total-supply"]; //TODO: Tokens minted image to be changed
      titles = ["Ost Staked", "Tokens Minted", "Price in Ost"];
      values = [marketCapValue, totalSupplyValue, conversion_rate];
      visibility = [false, false, false];
    }

    for (let i = 0; i < images.length; i++) {
      details.push({
        img: images[i],
        title: titles[i],
        value: values[i],
        is_badge_visible: visibility[i]
      });
    }

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

    if (token_details && token_details.token_ost_volume){
      tokenVolumeValue = TokenUnits.convertToNormal(token_details.token_ost_volume).toFormat(0).toString(10)
    }

    var details = {
      token_transfers: tokentransfersValue,
      token_volume: tokenVolumeValue
    };

    return details;
  }
};

module.exports = GetBrandedTokenDetailsKlass;