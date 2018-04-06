"use strict";

const rootPrefix = "../../.."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstants = require(rootPrefix + '/config/core_constants')
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
    ;

    finalFormattedHomeData['home_data'] = '';
    finalFormattedHomeData['chain_info'] = oThis.getChainInfo();
    finalFormattedHomeData['chain_stats'] = oThis.getChainStats();

    return Promise.resolve(responseHelper.successWithData(finalFormattedHomeData));
  }

  , getChainInfo: function (chain_data) {

    const oThis = this;

    var communitiesValue = 0
      , tokenHoldersValue = 0
      , marketCapValue = 0
    ;

    if (chain_data && chain_data.maxId){
      communitiesValue = TokenUnits.toBigNumber(chain_data.maxId).toFormat(0);
    }

    if (chain_data && chain_data.tokenHolders){
      tokenHoldersValue = TokenUnits.toBigNumber(chain_data.tokenHolders).toFormat(0)
    }

    if (chain_data && chain_data.marketCap){
      marketCapValue = TokenUnits.convertToNormal(chain_data.marketCap).toFormat(0)
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

    var tokentransfersValue = 0
      , tokenVolumeValue = 0
    ;

    if (chain_data && chain_data.token_transfers){
      tokentransfersValue = TokenUnits.toBigNumber().toFormat(0).toString(10);
    }

    if (chain_data && chain_data.token_volume){
      tokenVolumeValue = TokenUnits.convertToNormal(chain_data['token_volume']).toFormat(0).toString(10)
    }
    const details = {
      token_transfers: tokentransfersValue,
      token_volume: tokenVolumeValue
    };

    return details;
  }
};

module.exports = GetHomeDetailsKlass;