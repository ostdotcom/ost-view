"use strict";

const rootPrefix = "../../.."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , TokenUnits = require(rootPrefix + '/helpers/tokenUnits')
  , HomePageStatsCacheKlass = require (rootPrefix + '/lib/cache_management/home_page_stats')
;

/**
 * Get Details of a home page
 *
 * @param {object} params - this is object with keys.
 *                 chainId - Chain Id.
 *
 * @Constructor
 */
const GetHomeDetailsKlass = function(params){
  const oThis = this;

  oThis.chainId = params.chainId;

  if (!oThis.chainId) {
    oThis.chainId = coreConstants.DEFAULT_CHAIN_ID;
  }
};

GetHomeDetailsKlass.prototype = {

  /**
   * Perform operation of getting home page details
   *
   * @return {Promise<void>}
   */
  perform: async function(){
    const oThis = this
      , finalFormattedHomeData = {}
      , homePageStatsData = await  new HomePageStatsCacheKlass({chain_id:oThis.chainId}).fetch()
      , homePageStats = homePageStatsData.data
    ;

    finalFormattedHomeData['home_data'] = homePageStats;
    finalFormattedHomeData['chain_info'] = oThis.getChainInfo(homePageStats);
    finalFormattedHomeData['chain_stats'] = oThis.getChainStats(homePageStats);

    return Promise.resolve(responseHelper.successWithData(finalFormattedHomeData));
  }

  , getChainInfo: function (chain_data) {

    const oThis = this;

    var communitiesValue = 0
      , tokenHoldersValue = 0
      , marketCapValue = 0
    ;

    if (chain_data && chain_data.communities_count){
      communitiesValue = TokenUnits.toBigNumber(chain_data.communities_count).toFormat(0);
    }

    if (chain_data && chain_data.holders_count){
      tokenHoldersValue = TokenUnits.toBigNumber(chain_data.holders_count).toFormat(0)
    }

    if (chain_data && chain_data.market_cap){
      marketCapValue = TokenUnits.convertToNormal(chain_data.market_cap).toFormat(0)
    }
    const details = [
      {
        img: "communities",
        title: "Communities",
        value: communitiesValue,
        is_badge_visible: false
      },
      {
        img: "token-holders",
        title: "Token Holders",
        value: tokenHoldersValue,
        is_badge_visible: false
      },
      {
        img: "market-cap",
        title: "Market Cap",
        value: marketCapValue,
        is_badge_visible: true
      }
    ];

    return details;
  },

  getChainStats: function (chain_data) {
    const oThis = this;

    var tokenTransfersValue = 0
      , tokenOstVolumeValue = 0
    ;

    if (chain_data && chain_data.token_transfers){
      tokenTransfersValue = TokenUnits.toBigNumber(chain_data.token_transfers).toFormat(0).toString(10);
    }

    if (chain_data && chain_data.token_ost_volume){
      tokenOstVolumeValue = TokenUnits.convertToNormal(chain_data.token_ost_volume).toFormat(0).toString(10)
    }
    const details = {
      token_transfers: tokenTransfersValue,
      token_volume: tokenOstVolumeValue
    };

    return details;
  }
};

module.exports = GetHomeDetailsKlass;