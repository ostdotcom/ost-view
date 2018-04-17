//node executables/total_supply_update_script.js
"use strict";

const rootPrefix = ".."
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , BrandedTokenStatsModelKlass = require(rootPrefix + '/app/models/branded_token_stats')
  , BrandedTokenCacheKlass = require(rootPrefix+ '/lib/cache_multi_management/branded_tokens')
  , AddressesCacheKlass = require(rootPrefix + '/lib/cache_multi_management/addresses')
  , Web3Interact = require(rootPrefix + "/lib/web3/interact/rpc_interact")
  , TokenUnits = require(rootPrefix + "/helpers/tokenUnits")
  , BrandedTokenStatsKlass = require(rootPrefix + '/app/models/branded_token_stats')
  , BrandedTokenStatsCacheKlass = require(rootPrefix+'/lib/cache_multi_management/branded_token_stats')
;

/**
 * Global Constants
 */
const chainId = coreConstants.DEFAULT_CHAIN_ID;

/**
 * getTokenTotalSupply
 * @param contractAddress Contract Address
 * @returns {Promise<T>}
 */
const getTokenTotalSupply = async function (contractAddress){
  const oThis = this;

  let web3Interact = Web3Interact.getInstance(chainId);

  let tokenSupply = web3Interact.getTotalSupply(contractAddress)
    .then(function(totalSupply){
      return totalSupply;
    })
    .catch(function (err) {
      logger.notify('l_bu_ad_gtts_1', 'error in getting token supply for contractAddress : '+contractAddress , err);
      return 0;
    });

  return tokenSupply;
};

/**
 * @param contractAddress Contract Address
 */

const clearBrandedTokenStatsCache = async function (contractAddressIds) {

  const brandedTokenCacheObject = await new BrandedTokenCacheKlass({chain_id:chainId, contract_address_ids: contractAddressIds}).clear();
};

/**
 * updateTotalSupply
 */
(async function updateTotalSupply(){

  const oThis = this
    , contractAddressIdHash = {}
    , brandedTokenStatsModelObject = new BrandedTokenStatsModelKlass(chainId)

    // 1. Get all the branded token Ids having zero total_supply.
    , brandedTokenStatsQueryResponse = await brandedTokenStatsModelObject.select('contract_address_id')
      .where({total_supply:0})
      .fire()
  ;

  if(brandedTokenStatsQueryResponse.length === 0){
    logger.error("Data not available to update total_supply");
    process.exit(1);
  }

  // 2. Create Hash of contract address Ids
  for (let i=0; i<brandedTokenStatsQueryResponse.length; i++){
    const contractAddressId = brandedTokenStatsQueryResponse[i].contract_address_id
    ;
    contractAddressIdHash[contractAddressId] = {};
  }

  // 3. Get contract Address from contract Ids
  const addressesCacheResponse = await new AddressesCacheKlass({chain_id:chainId, ids:Object.keys(contractAddressIdHash)}).fetch()
    , addressesCacheResponseData = addressesCacheResponse.data

    // 4. Get Branded Tokens info from Branded Token table using contract address ids
    , brandedTokenCacheResponse = await new BrandedTokenCacheKlass({chain_id:chainId, contract_address_ids:Object.keys(contractAddressIdHash)}).fetch()
    , brandedTokenCacheResponseData = brandedTokenCacheResponse.data
  ;

  // 4. Traverse all the contract address ids for processing
  for (let contractAddressId in contractAddressIdHash){
    const addressInfo = addressesCacheResponseData[contractAddressId]
      , address = addressInfo.address_hash

      // 4.1 Get total supply using contract address
      , totalTokens = await getTokenTotalSupply(address)

      // 4.2 Get conversion rate from branded token info hash.
      , brandedToken = brandedTokenCacheResponseData[contractAddressId]
      , conversionRate = brandedToken.conversion_rate || undefined
    ;

    if (!conversionRate) {
      logger.error("conversion rate is not defined for contract address ::", address);
      process.exit(1);
    }

    // 4.3 Determine market cap using total supply and conversion rate
    const market_cap = TokenUnits.toBigNumber(totalTokens).div(TokenUnits.toBigNumber(conversionRate)).toString(10);

    // 4.4 Update Branded Token stats table with total supply and market cap.
    await new BrandedTokenStatsKlass(chainId)
      .update({total_supply: totalTokens, market_cap: market_cap})
      .where({contract_address_id: contractAddressId})
      .fire()
  }

  await clearBrandedTokenStatsCache(Object.keys(contractAddressIdHash));

})();