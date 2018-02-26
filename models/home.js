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
  ;

/**
 * @constructor
 *
 * @param {Integer} chainId - chain id to connect to respective geth node and database instance
 */
var home = module.exports = function (chainId) {
  this._dbInstance = dbInteract.getInstance(coreConfig.getChainDbConfig(chainId));
}


home.prototype = {

  getHomeData: function(){

    const oThis = this;

    return new Promise(function (resolve, reject) {
      oThis._dbInstance.getChainHomeData()
        .then(function (response) {
          resolve(response);
        })
        .catch(function (reason) {
          reject(reason);
        });
    });

  }

  , getChainInfo: function(chain_data){
      var details = [
        {
          img:"communities",
          title:"Communities",
          value:chain_data['MAX(id)'],
          is_badge_visible:false
        },
        {
          img:"token-holders",
          title:"Token Holders",
          value:chain_data['SUM(token_holders)'],
          is_badge_visible:false
        },
        {
          img:"market-cap",
          title:"Market Cap",
          value:chain_data['SUM(market_cap)'],
          is_badge_visible:true
        }
      ];

      return details;
  }
}