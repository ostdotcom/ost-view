/**
 * Created by Aniket on 22/02/18.
 */

/**
 * Model to fetch home related details from database or from chain.
 *
 * @module models/contract
 */

// load all internal dependencies
const rootPrefix = ".."
  , dbInteract = require(rootPrefix + '/lib/storage/interact')
  , constants = require(rootPrefix + '/config/core_constants')
  , coreConfig = require(rootPrefix + '/config')
  , TokenUnits = require(rootPrefix + '/helpers/tokenUnits')
  ;

/**
 * @constructor
 *
 * @param {Integer} chainId - chain id to connect to respective geth node and database instance
 */
var home = module.exports = function (chainId) {
  this._dbInstance = dbInteract.getInstance(coreConfig.getChainDbConfig(chainId));
};


home.prototype = {

  getHomeData: function () {

    const oThis = this;

    return new Promise(function (resolve, reject) {
      oThis._dbInstance.getChainHomeData()
        .then(function (response) {
          oThis._dbInstance.getBrandedTokenFromId(0)
            .then(function (stateResponse) {
              var transfers = stateResponse.token_transfers
                , volume = stateResponse.token_ost_volume
                ;

              response["token_transfers"] = transfers;
              response["token_volume"] = volume;
              resolve(response);
            });
        })
        .catch(function (reason) {
          reject(reason);
        });
    });

  },

  getChainInfo: function (chain_data) {
    var details = [
      {
        img: "communities",
        title: "Communities",
        value: TokenUnits.toBigNumber(chain_data.maxId).toFormat(0),
        is_badge_visible: false
      },
      {
        img: "token-holders",
        title: "Token Holders",
        value: TokenUnits.toBigNumber(chain_data.tokenHolders).toFormat(0),
        is_badge_visible: false
      },
      {
        img: "market-cap",
        title: "Market Cap",
        value: TokenUnits.convertToNormal(chain_data.marketCap).toFormat(0),
        is_badge_visible: true
      }
    ];

    return details;
  },

  getChainStats: function (chain_data) {
    var details = {
      token_transfers: TokenUnits.toBigNumber(chain_data['token_transfers']).toFormat(0),
      token_volume: TokenUnits.convertToNormal(chain_data['token_volume']).toFormat(0)
    };

    return details;
  }
};